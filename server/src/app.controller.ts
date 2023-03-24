import { status } from '@grpc/grpc-js';
import { Controller, Get } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Task } from '@prisma/client';
import { AppService } from './app.service';
import {
  FindAllRequest,
  FindAllResponse,
  CreateRequest,
  CreateResponse,
  Task as PbTask,
  FindByIdRequest,
  FindByIdResponse,
  UpdateRequest,
  UpdateResponse,
  DeleteRequest,
  DeleteResponse,
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

  @GrpcMethod('TaskService')
  async FindById(req: FindByIdRequest): Promise<FindByIdResponse> {
    const { id } = req;
    const task = await this.appService.task({
      id: +id,
    });

    return {
      task: task && this.toPb(task),
    };
  }

  @GrpcMethod('TaskService')
  async Update(req: UpdateRequest): Promise<UpdateResponse> {
    const { id } = req;
    const update = {
      ...req,
      id: undefined,
    };

    Object.keys(update).forEach(
      (key) => update[key] === undefined && delete update[key],
    );

    const task = await this.appService.updateTask({
      where: {
        id: +id,
      },
      data: update,
    });

    return { task: task && this.toPb(task) };
  }

  @GrpcMethod('TaskService')
  async Delete(req: DeleteRequest): Promise<DeleteResponse> {
    try {
      const { id } = req;

      const task = await this.appService.deleteTask({
        id: +id,
      });

      return { task: task && this.toPb(task) };
    } catch (error) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: error,
      });
    }
  }
}
