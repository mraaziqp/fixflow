export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export type Device = {
  id: string;
  serialNumber: string;
  model: string;
  type: 'Phone' | 'Laptop' | 'Tablet' | 'Other';
};

export type JobStatus = 'To Do' | 'Waiting' | 'Ready' | 'Done';
export type JobUrgency = 'low' | 'medium' | 'high';

export type Job = {
  id: string;
  customerId: string;
  deviceId: string;
  description: string;
  status: JobStatus;
  urgency: JobUrgency;
  tags: string[];
  cost: number;
  createdAt: string;
  updatedAt: string;
};

export type JobWithRelations = Job & {
  customer: Customer;
  device: Device;
};
