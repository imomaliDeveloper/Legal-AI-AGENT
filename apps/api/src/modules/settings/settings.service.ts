import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    // Mask secret values
    return settings.map((s) => ({
      ...s,
      value: s.isSecret ? '••••••••' : s.value,
    }));
  }

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting ? setting.value : null;
  }

  async setSetting(key: string, value: string, description?: string, category = 'general', isSecret = false) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description,
        category,
        isSecret,
      },
      create: {
        key,
        value,
        description,
        category,
        isSecret,
      },
    });
  }
}
