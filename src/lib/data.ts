import type { Customer, Device, Job, JobWithRelations } from './types';

export const customers: Customer[] = [
  { id: 'cus_1', name: 'John Doe', phone: '123-456-7890', email: 'john.doe@example.com' },
  { id: 'cus_2', name: 'Jane Smith', phone: '098-765-4321', email: 'jane.smith@example.com' },
  { id: 'cus_3', name: 'Peter Jones', phone: '555-555-5555', email: 'peter.jones@example.com' },
];

export const devices: Device[] = [
  { id: 'dev_1', serialNumber: 'SN12345678', model: 'iPhone 13', type: 'Phone' },
  { id: 'dev_2', serialNumber: 'SN87654321', model: 'MacBook Pro 16"', type: 'Laptop' },
  { id: 'dev_3', serialNumber: 'SN55555555', model: 'iPad Air', type: 'Tablet' },
  { id: 'dev_4', serialNumber: 'SN99999999', model: 'Galaxy S22', type: 'Phone' },
];

export const jobs: Job[] = [
  {
    id: 'job_1',
    customerId: 'cus_1',
    deviceId: 'dev_1',
    description: 'Screen is cracked after a drop. The touch functionality is intermittent.',
    status: 'To Do',
    urgency: 'high',
    tags: ['screen_replacement', 'impact_damage'],
    cost: 250,
    createdAt: '2023-10-26T10:00:00Z',
    updatedAt: '2023-10-26T10:00:00Z',
  },
  {
    id: 'job_2',
    customerId: 'cus_2',
    deviceId: 'dev_2',
    description: 'Laptop is not turning on. No lights, no sounds. Was working fine yesterday.',
    status: 'To Do',
    urgency: 'high',
    tags: ['no_power', 'diagnostics'],
    cost: 75,
    createdAt: '2023-10-26T11:30:00Z',
    updatedAt: '2023-10-26T11:30:00Z',
  },
  {
    id: 'job_3',
    customerId: 'cus_3',
    deviceId: 'dev_3',
    description: 'Customer wants a new battery. Current one only lasts a couple of hours.',
    status: 'Waiting',
    urgency: 'medium',
    tags: ['battery_replacement'],
    cost: 150,
    createdAt: '2023-10-25T14:00:00Z',
    updatedAt: '2023-10-25T16:00:00Z',
  },
  {
    id: 'job_4',
    customerId: 'cus_1',
    deviceId: 'dev_4',
    description: 'Device is ready for pickup. Replaced the charging port.',
    status: 'Ready',
    urgency: 'low',
    tags: ['charging_port', 'soldering'],
    cost: 95,
    createdAt: '2023-10-24T09:00:00Z',
    updatedAt: '2023-10-26T15:00:00Z',
  },
  {
    id: 'job_5',
    customerId: 'cus_2',
    deviceId: 'dev_2',
    description: 'Logic board repair complete, all tests passed. Device is ready for customer pickup.',
    status: 'Ready',
    urgency: 'high',
    tags: ['logic_board', 'no_power', 'diagnostics'],
    cost: 450,
    createdAt: '2023-10-26T11:30:00Z',
    updatedAt: '2023-10-27T12:00:00Z',
  },
];

// In a real app, this would be a database query with joins.
export function getJobsWithRelations(): JobWithRelations[] {
  return jobs.map(job => {
    const customer = customers.find(c => c.id === job.customerId);
    const device = devices.find(d => d.id === job.deviceId);
    if (!customer || !device) {
      throw new Error(`Could not find relations for job ${job.id}`);
    }
    return { ...job, customer, device };
  });
}

export function getJobById(id: string): JobWithRelations | undefined {
    const job = jobs.find(j => j.id === id);
    if (!job) return undefined;

    const customer = customers.find(c => c.id === job.customerId);
    const device = devices.find(d => d.id === job.deviceId);
    if (!customer || !device) {
        return undefined;
    }
    return { ...job, customer, device };
}
