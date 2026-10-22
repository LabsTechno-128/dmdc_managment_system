import { IsObject, IsOptional } from 'class-validator';

export class UpdateLandingContentDto {
    @IsObject()
    @IsOptional()
    hero?: Record<string, any>;

    @IsObject()
    @IsOptional()
    about?: Record<string, any>;

    @IsObject()
    @IsOptional()
    services?: Record<string, any>;

    @IsObject()
    @IsOptional()
    stats?: Record<string, any>;

    @IsObject()
    @IsOptional()
    articles?: Record<string, any>;

    @IsObject()
    @IsOptional()
    contact?: Record<string, any>;

    @IsObject()
    @IsOptional()
    seo?: Record<string, any>;

    @IsObject()
    @IsOptional()
    sectionVisibility?: Record<string, boolean>;

    @IsObject()
    @IsOptional()
    doctorSettings?: Record<string, any>;
}
