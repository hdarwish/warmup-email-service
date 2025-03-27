import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() user: Partial<User>): Promise<User> {
    return this.usersService.create(user);
  }
} 