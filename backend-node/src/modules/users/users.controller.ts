import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('firebase/:firebaseUid')
  async findByFirebaseUid(@Param('firebaseUid') firebaseUid: string) {
    return this.usersService.findByFirebaseUid(firebaseUid);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const dbUser = await this.usersService.findByFirebaseUid(user.sub);
    if (dbUser.id !== id) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Put()
  @UseGuards(FirebaseAuthGuard)
  async updateOwnProfile(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const dbUser = await this.usersService.findByFirebaseUid(user.sub);
    return this.usersService.update(dbUser.id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
