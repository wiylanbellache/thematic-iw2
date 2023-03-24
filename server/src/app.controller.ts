import { Controller, Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Task } from '@prisma/client';
import { AppService } from './app.service';
import {
  FindAllRequest,
  FindAllResponse,
  CreateRequest,
  CreateResponse,
  Task as PbTask,
} from './stub/task/task';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  toPb(t: Task): PbTask {
    return {
      ...t,
      dueDate: t.dueDate.toISOString(),
      id: `${t.id}`,
    };
  }

  @GrpcMethod('TaskService')
  async FindAll(req: FindAllRequest): Promise<FindAllResponse> {
    const { done } = req;

    const tasks = await this.appService.tasks({
      where: {
        done,
      },
    });

    const pbTasks = tasks.map(this.toPb);

    return { tasks: pbTasks };
  }

  @GrpcMethod('TaskService')
  async Create(req: CreateRequest): Promise<CreateResponse> {
    const task = await this.appService.createTask({ ...req, done: false });

    return {
      task: this.toPb(task),
    };
  }
}
