import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NotificationsService {
    constructor(private readonly databaseService: DatabaseService) {}

    async findAllForUser(userId: string) {
        return this.databaseService.repoNotification().find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    async markAsRead(id: string) {
        await this.databaseService.repoNotification().update(id, { isRead: true });
        return this.databaseService.repoNotification().findOne({ where: { id } });
    }
}
