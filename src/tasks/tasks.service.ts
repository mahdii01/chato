import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  private readonly csvFilePath = path.join(__dirname, '..', '..', 'tasks.csv');
  
  // Helper function to read from CSV
  private async readTasksFromCsv(): Promise<Task[]> {
    if (!fs.existsSync(this.csvFilePath)) {
      return [];
    }
    const fileContent = fs.readFileSync(this.csvFilePath, 'utf8');
    const parsed = Papa.parse(fileContent, { header: true, dynamicTyping: true });
    return parsed.data as Task[];
  }

  // Helper function to write to CSV
  private async writeTasksToCsv(tasks: Task[]): Promise<void> {
    const csv = Papa.unparse(tasks);
    fs.writeFileSync(this.csvFilePath, csv);
  }

  // POST: Create a new task
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const tasks = await this.readTasksFromCsv();
    const newTask: Task = {
      id: uuidv4(),
      title: createTaskDto.title,
      isCompleted: false,
    };
    tasks.push(newTask);
    await this.writeTasksToCsv(tasks);
    return newTask;
  }

  // GET (All): Find all tasks
  async findAll(): Promise<Task[]> {
    return this.readTasksFromCsv();
  }

  // GET (by ID): Find a single task
  async findOne(id: string): Promise<Task> {
    const tasks = await this.readTasksFromCsv();
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  // PUT: Update a task
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const tasks = await this.readTasksFromCsv();
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    const updatedTask = { ...tasks[taskIndex], ...updateTaskDto };
    tasks[taskIndex] = updatedTask;
    await this.writeTasksToCsv(tasks);
    return updatedTask;
  }

  // DELETE: Remove a task
  async remove(id: string): Promise<{ message: string }> {
    let tasks = await this.readTasksFromCsv();
    const initialLength = tasks.length;
    tasks = tasks.filter((t) => t.id !== id);
    if (tasks.length === initialLength) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    await this.writeTasksToCsv(tasks);
    return { message: `Task with ID "${id}" successfully removed` };
  }
}
