import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { BulkCreateTagDto } from './dto/bulk-create-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag)
    private readonly tagModel: typeof Tag,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    return this.tagModel.create(createTagDto as any);
  }

  async bulkCreate(bulkCreateTagDto: BulkCreateTagDto): Promise<{ created: number; tags: Tag[] }> {
    const createdTags: Tag[] = [];

    for (const tagName of bulkCreateTagDto.tags) {
      const trimmedName = tagName.trim();
      if (trimmedName) {
        const tag = await this.tagModel.create({
          tag_name: trimmedName,
        } as any);
        createdTags.push(tag);
      }
    }

    return {
      created: createdTags.length,
      tags: createdTags,
    };
  }

  async findAll(limit = 100, offset = 0): Promise<{ rows: Tag[]; count: number }> {
    return this.tagModel.findAndCountAll({
      limit,
      offset,
      order: [['id', 'ASC']],
    });
  }

  async findById(id: number): Promise<Tag> {
    const tag = await this.tagModel.findByPk(id);
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findById(id);
    return tag.update(updateTagDto as any);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.findById(id);
    await tag.destroy();
  }
}
