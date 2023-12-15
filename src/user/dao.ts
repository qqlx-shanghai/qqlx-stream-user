import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { RELATIONS_POND_LOG } from "qqlx-core";
import { toNumber, toString, PondLogSchema } from "qqlx-cdk";
import { getLocalNetworkIPs, PgDao } from "qqlx-sdk";

@Injectable()
export class PondLogDao extends PgDao<PondLogSchema> {
    constructor(
        @InjectRepository(PondLogSchema)
        private readonly pondLogRepository: Repository<PondLogSchema>
    ) {
        super({
            repository: pondLogRepository,
            relations_name: RELATIONS_POND_LOG,
        });
    }
}
