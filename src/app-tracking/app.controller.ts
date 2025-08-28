import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Render, Req } from "@nestjs/common";
import { AppTrackingService } from "./app.service";

type SortBy = 'downCount' | 'createdAt' | 'updatedAt' | 'releaseDate';
type SortDir = 'asc' | 'desc';

@Controller('')
export class AppTrackingController {
    constructor(private readonly appTrackingService: AppTrackingService) { }


    //   @Post('worldfirst')
    //   async saveWFOtp(@Body()body: { account: string, otp: string }) {
    //     return this.appTrackingService.saveWFOtp(body)
    //   }


    @Get()
    test() {
        // return this.appTrackingService.updateAppInfo()
    }

    @Post('/api/apps')
    create(@Body() body: { pkgName: string, group: string, category: string }) {
        return this.appTrackingService.addAppToTracking(body);
    }

    @Render('home')
    @Get('home')
    async home(
        @Query('q') q = '',
        @Query('group') group = '',
        @Query('category') category = '',
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: SortBy,
        @Query('sortDir') sortDir?: SortDir,
    ) {
        // Chuẩn hoá tham số
        const clean = (v?: string) => (typeof v === 'string' ? v.trim() : '');
        const selCategory = clean(category); // rỗng => không lọc
        const selGroup = clean(group);
        const selQ = clean(q);

        // Bảo vệ sortBy/sortDir
        const ALLOWED_SORT: SortBy[] = ['downCount', 'createdAt', 'updatedAt', 'releaseDate'];
        const ALLOWED_DIR: SortDir[] = ['asc', 'desc'];
        const safeSortBy: SortBy = (ALLOWED_SORT as string[]).includes(String(sortBy)) ? (sortBy as SortBy) : 'downCount';
        const safeSortDir: SortDir = (ALLOWED_DIR as string[]).includes(String(sortDir)) ? (sortDir as SortDir) : 'desc';

        const params = {
            q: selQ,
            group: selGroup,
            category: selCategory,   // sẽ lọc theo category nếu có, rỗng -> không lọc
            page: Number(page) || 1,
            pageSize: Number(pageSize) || 30,
            sortBy: safeSortBy,
            sortDir: safeSortDir,
        };

        // Lấy dữ liệu theo filter mới
        const { freeApps, paidApps, grossingApps } = await this.appTrackingService.getApps(params);

        // Danh sách chọn trong dropdown (mảng string)
        const [groups, categories] = await Promise.all([
            this.appTrackingService.getGroups(),      // ['Scanner','Wallpaper',...]
            this.appTrackingService.getCategories(),  // ['Utilities','Lifestyle',...]
        ]);

        return {
            pageTitle: 'Top Charts',
            // giữ trạng thái đã chọn để template render selected
            selectedGroup: selGroup,
            selectedCategory: selCategory,
            groups,
            categories,
            freeApps,
            paidApps,
            grossingApps,
        };
    }
}