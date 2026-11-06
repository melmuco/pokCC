import { PartialType } from '@nestjs/swagger';
import { CreateScansioneDto } from './create-scansione.dto';

export class UpdateScansioneDto extends PartialType(CreateScansioneDto) {}