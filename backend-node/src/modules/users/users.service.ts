import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingByUid = await this.userModel.findOne({
      where: { firebase_uid: createUserDto.firebase_uid },
    });
    if (existingByUid) {
      return existingByUid;
    }

    if (createUserDto.email) {
      const existingByEmail = await this.userModel.findOne({
        where: { email: createUserDto.email },
      });
      if (existingByEmail) {
        await existingByEmail.update({
          firebase_uid: createUserDto.firebase_uid,
        } as any);
        return existingByEmail;
      }
    }

    try {
      return await this.userModel.create(createUserDto as any);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const recovered = await this.userModel.findOne({
          where: { email: createUserDto.email },
        });
        if (recovered) {
          await recovered.update({
            firebase_uid: createUserDto.firebase_uid,
          } as any);
          return recovered;
        }
        throw new ConflictException(
          'Email or Firebase UID already exists',
        );
      }
      throw error;
    }
  }

  async findAll(limit = 10, offset = 0): Promise<{ rows: User[]; count: number }> {
    return this.userModel.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User> {
    const user = await this.userModel.findOne({
      where: { firebase_uid: firebaseUid },
    });
    if (!user) {
      throw new NotFoundException(
        `User with Firebase UID ${firebaseUid} not found`,
      );
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    const normalizedData = this.normalizeUpdateData(updateUserDto);
    return user.update(normalizedData as any);
  }

  private normalizeUpdateData(data: UpdateUserDto): any {
    return {
      full_name: data.full_name || data.fullName,
      bio: data.bio,
      city: data.city,
      favorite_genre: data.favorite_genre || data.favoriteGenre,
      profile_image: data.profile_image || data.profileImage,
    };
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await user.destroy();
  }
}
