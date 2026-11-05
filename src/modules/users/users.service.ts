import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const code = String(createUserDto.code).trim();
    const identification = String(createUserDto.identification).trim();
    const email = String(createUserDto.email).trim().toLowerCase();

    // Verificación preventiva de duplicados para evitar error 500 no controlado
    const existing = await this.userRepository.findOne({
      where: [{ code }, { identification }, { email }],
    });

    if (existing) {
      if (existing.code === code) {
        throw new ConflictException(`El código universitario '${code}' ya se encuentra registrado.`);
      }
      if (existing.identification === identification) {
        throw new ConflictException(
          `La identificación '${identification}' ya se encuentra registrada.`,
        );
      }
      if (existing.email.toLowerCase() === email) {
        throw new ConflictException(
          `El correo electrónico '${email}' ya se encuentra registrado.`,
        );
      }
    }

    try {
      const user = this.userRepository.create({
        ...createUserDto,
        code,
        identification,
        email,
        semester: createUserDto.semester ? Number(createUserDto.semester) : undefined,
      });
      return await this.userRepository.save(user);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          error?.detail || 'Ya existe un usuario con este código, identificación o correo.',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByCode(code: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { code } });
    if (!user) {
      throw new NotFoundException(`Usuario con código ${code} no encontrado`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
