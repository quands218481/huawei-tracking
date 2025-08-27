import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { HttpService } from "@nestjs/axios";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AppTracking } from "./app.schema";
import { AppGroup } from "./group.schema";
import { AppCategory } from "./category.schema";

type Bucket = 'free' | 'paid' | 'grossing';
interface GetAppsParams {
    q?: string;
    group?: string;          // ví dụ: 'wallpaper'
    category?: string;       // ví dụ: 'utilities' (AppTracking.category là string[])
    page?: number;           // mặc định 1
    pageSize?: number;       // mặc định 30
    sortBy?: 'downCount' | 'createdAt' | 'updatedAt' | 'releaseDate';
    sortDir?: 'asc' | 'desc';
}

@Injectable()
export class AppTrackingService {
    constructor(
        private readonly http: HttpService,
        @InjectModel(AppTracking.name) private appTrackingModel: Model<AppTracking>,
        @InjectModel(AppGroup.name) private appGroupModel: Model<AppGroup>,
        @InjectModel(AppCategory.name) private appCategoryModel: Model<AppCategory>,
    ) {
    }

    async addAppToTracking(body: { pkgName: string, group: string, category: string }) {
        try {
            const { pkgName, group, category } = { ...body }
            if (!pkgName || !group || !category) {
                return { success: false }
            }
            else {
                const res = await this.getAppInfo(pkgName)
                if (res && res.success) {
                    const { downCount, version, developerName, briefDes, name, icon, description, releaseDate, screenShots } = res.data || {};
                    const app_url = `https://appgallery.huawei.com/app/detail?id=${pkgName}`
                    await this.appTrackingModel.create({ pkgName, group, category, app_url, chartType: 'free', downCount, version, developerName, briefDes, name, icon, description, releaseDate, screenShots })
                    return { success: true }
                } else {
                    return { success: false }
                }
            }
        } catch (error) {
            return { success: false }
        }
    }

    // async getApps() {
    //     try {
    //         return await this.appTrackingModel.find()
    //     } catch (error) {
    //         return { success: false }
    //     }
    // }

    async getGroups() {
        try {
            return (await this.appGroupModel.find().lean()).map((doc) => doc.group)
        } catch (error) {
            return { success: false }
        }
    }

    async getCategories() {
        try {
            return (await this.appCategoryModel.find().lean()).map((doc) => doc.category)
        } catch (error) {
            return { success: false }
        }
    }

    async addGroup(group: string) {
        try {
            this.appGroupModel.create({ group })
            return { success: true }
        } catch (error) {
            return { success: false }
        }
    }

    async addCategory(category: string) {
        try {
            this.appCategoryModel.create({ category })
            return { success: true }
        } catch (error) {
            return { success: false }
        }
    }
    // private buildFilter({ q, group, category }: GetAppsParams): FilterQuery<AppTracking> {
    //     const filter: FilterQuery<AppTracking> = {};

    //     // q: tìm theo name (regex, không phân biệt hoa thường)
    //     if (q && q.trim()) {
    //         filter.name = { $regex: q.trim(), $options: 'i' };
    //     }

    //     // group: chuỗi
    //     if (group && group.trim()) {
    //         filter.group = group.trim();
    //     }

    //     // category: AppTracking.category là string[]
    //     if (category && category.trim()) {
    //         filter.category = { $in: [category.trim()] };
    //     }

    //     return filter;
    // }
    private buildBaseMatch({ q, group, category }: GetAppsParams) {
        const $and: any[] = [];

        if (q && q.trim()) {
            $and.push({ name: { $regex: q.trim(), $options: 'i' } });
        }
        if (group && group.trim()) {
            $and.push({ group: group.trim() });
        }
        if (category && category.trim()) {
            // category là string[] → dùng $in
            $and.push({ category: { $in: [category.trim()] } });
        }

        return $and.length ? { $and } : {};
    }

    /** Project các field cần thiết theo schema AppTracking */
    private projectionStage() {
        return {
            $project: {
                _id: 0,
                name: 1,
                developerName: 1,
                icon: 1,
                downCount: 1,
                downCountDesc: 1,
                group: 1,
                category: 1,
                app_url: 1,
                pkgName: 1,
                releaseDate: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        };
    }

    /** Tạo pipeline cho một bucket (free/paid/grossing) */
    private buildBucketPipeline(params: GetAppsParams, bucket: Bucket) {
        const match = this.buildBaseMatch(params);
        const sortBy = params.sortBy ?? 'downCount';
        const sortDir = params.sortDir === 'asc' ? 1 : -1;
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(Math.max(1, params.pageSize ?? 30), 200);

        const pipeline: any[] = [];

        // match base
        if (Object.keys(match).length) pipeline.push({ $match: match });

        // match theo bucket (cần cột chartType trong collection)
        pipeline.push({ $match: { chartType: bucket } });

        // sắp xếp & phân trang
        pipeline.push({ $sort: { [sortBy]: sortDir, _id: -1 } });
        pipeline.push({ $skip: (page - 1) * pageSize });
        pipeline.push({ $limit: pageSize });

        // chọn field
        pipeline.push(this.projectionStage());

        return pipeline;
    }

    /** Lấy 3 cột: free / paid / grossing (Mongoose aggregation) */
    async getApps(params: GetAppsParams) {
        const [freeApps, paidApps, grossingApps] = await Promise.all([
            this.appTrackingModel.aggregate(this.buildBucketPipeline(params, 'free')).exec(),
            this.appTrackingModel.aggregate(this.buildBucketPipeline(params, 'paid')).exec(),
            this.appTrackingModel.aggregate(this.buildBucketPipeline(params, 'grossing')).exec(),
        ]);

        return { freeApps, paidApps, grossingApps };
    }

    /** (Tuỳ chọn) tổng số record theo filter cho pagination */
    async countByBucket(params: GetAppsParams) {
        const match = this.buildBaseMatch(params);

        const mk = (bucket: Bucket) =>
            this.appTrackingModel.aggregate([
                Object.keys(match).length ? { $match: match } : undefined,
                { $match: { chartType: bucket } },
                { $count: 'n' },
            ].filter(Boolean) as any)
                .then(([x]) => x?.n ?? 0);

        const [free, paid, grossing] = await Promise.all([
            mk('free'), mk('paid'), mk('grossing'),
        ]);

        return { free, paid, grossing, total: free + paid + grossing };
    }

    async getAppInfo(pkgName: string) {
        try {
            const config = {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/json',
                    'Identity-Id': 'd70e458147124c2baad127e458f24456',
                    'Interface-Code': 'eyJhbGdvcml0aG0iOiJIUzI1NiIsInR5cGUiOiJKV1QiLCJhbGciOiJIUzM4NCJ9.eyJpYXQiOjE3NTYyODAwMzEsImV4cCI6MTc1NjI4MDkzMSwianRpIjoiNDMxNmIyNmMtNmNhMC00MmYyLThlODktYTUwNDc5NTY5ZTViIiwic3ViIjoiYXV0aCIsInVzZXJuYW1lIjoiZDcwZTQ1ODE0NzEyNGMyYmFhZDEyN2U0NThmMjQ0NTYifQ.pQ5Yq1aM-oQsOLn2fRiVbgXmpb2rc5BB-N1vbCDqHvlCz4sOWvMEwAQuKGCkHuAF_1756280030873',
                    'Origin': 'https://appgallery.huawei.com',
                    'Referer': 'https://appgallery.huawei.com/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'Sec-Fetch-Storage-Access': 'active',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
                }
            }
            const body = {
                pkgName,
                "appId": pkgName,
                "locale": "en_US",
                "countryCode": "US",
                "orderApp": 1
            }
            const url = 'https://web-dra.hispace.dbankcloud.com/edge/webedge/appinfo'
            const res = await this.http.axiosRef.post(url, body, config)
            if (res && res.data) {
                return {
                    success: true, data: res.data
                }
            } else {
                return {
                    success: false
                }
            }
        } catch (error) {
            return {
                success: false
            }
        }
    }
}