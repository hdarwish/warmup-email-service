import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/user/entities/user.entity';
import { Quota } from '../../../domain/user/entities/quota.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Quota)
    private readonly quotaRepository: Repository<Quota>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: { email: string; password: string; name: string }) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      tenantId: uuidv4(),
    });
    const savedUser = await this.userRepository.save(user);

    // Create initial quota for the user
    const quota = this.quotaRepository.create({
      user: savedUser,
      initialDailyLimit: 10,
      maxDailyLimit: 100,
      warmupDay: 1,
      growthRate: 1.5,
    });
    await this.quotaRepository.save(quota);

    return { message: 'User registered successfully' };
  }

  async login(loginDto: { email: string; password: string }) {
    const user = await this.userRepository.findOne({ where: { email: loginDto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, tenantId: user.tenantId };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async generateToken(payload: { sub: string; email: string; tenantId: string }) {
    return this.jwtService.signAsync(payload);
  }
} 