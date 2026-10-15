import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { CollectionType } from './enums/collection-type.enum';
import { ResourceStatus } from './enums/resource-status.enum';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
  ) {}

  async create(createResourceDto: CreateResourceDto): Promise<Resource> {
    const resource = this.resourceRepository.create({
      title: createResourceDto.title,
      code: createResourceDto.code,
      collection: createResourceDto.collection,
      status: createResourceDto.status || ResourceStatus.DISPONIBLE,
      location: createResourceDto.location,
      acquisitionDate: createResourceDto.acquisitionDate,
    });

    return await this.resourceRepository.save(resource);
  }

  async findAll(collection?: CollectionType, status?: ResourceStatus): Promise<Resource[]> {
    const query = this.resourceRepository.createQueryBuilder('resource')
      .leftJoinAndSelect('resource.generalBook', 'generalBook')
      .leftJoinAndSelect('resource.reserveBook', 'reserveBook')
      .leftJoinAndSelect('resource.referenceMaterial', 'referenceMaterial')
      .leftJoinAndSelect('resource.periodical', 'periodical')
      .leftJoinAndSelect('resource.mapItem', 'mapItem')
      .leftJoinAndSelect('resource.techDevice', 'techDevice');

    if (collection) {
      query.andWhere('resource.collection = :collection', { collection });
    }

    if (status) {
      query.andWhere('resource.status = :status', { status });
    }

    return await query.orderBy('resource.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: [
        'generalBook',
        'reserveBook',
        'referenceMaterial',
        'periodical',
        'mapItem',
        'techDevice',
      ],
    });

    if (!resource) {
      throw new NotFoundException(`Recurso con ID ${id} no encontrado`);
    }

    return resource;
  }

  async updateStatus(id: string, status: ResourceStatus): Promise<Resource> {
    const resource = await this.findOne(id);
    resource.status = status;
    return await this.resourceRepository.save(resource);
  }

  async remove(id: string): Promise<void> {
    const resource = await this.findOne(id);
    await this.resourceRepository.remove(resource);
  }
}
