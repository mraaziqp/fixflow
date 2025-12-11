'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAIAssistance, createNewJob } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Save, User, Smartphone, Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JobUrgency } from '@/lib/types';
// NOTE: This component is currently using mock data.
// To connect to a real database, you will need to replace the mock action calls
// in '@/lib/actions.ts' with your own database logic.

const formSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  deviceSerial: z.string().min(1, 'Device serial is required'),
  deviceModel: z.string().min(1, 'Device model is required'),
  issueDescription: z.string().min(10, 'Please provide a detailed description'),
  tags: z.array(z.string()),
  urgency: z.enum(['low', 'medium', 'high']),
});

type NewJobFormValues = z.infer<typeof formSchema>;

export function NewJobForm({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<NewJobFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      deviceSerial: (searchParams?.serial as string) || '',
      deviceModel: '',
      issueDescription: '',
      tags: [],
      urgency: 'medium',
    },
  });

  const handleGetAIAssistance = () => {
    const description = form.getValues('issueDescription');
    if (!description || description.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Description too short',
        description: 'Please provide a more detailed description for the AI to analyze.',
      });
      return;
    }
    startAiTransition(async () => {
      const result = await getAIAssistance(description);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'AI Assistance Error',
          description: result.error,
        });
      } else if (result.data) {
        toast({
          title: 'AI Suggestions Applied!',
          description: 'Tags and urgency have been updated.',
        });
        form.setValue('urgency', result.data.urgency);
        form.setValue('tags', result.data.tags);
        if (result.data.summary) {
            // You can decide where to put the summary, for now we can prepend it to the description
            const currentDescription = form.getValues('issueDescription');
            form.setValue('issueDescription', `${result.data.summary}. \n${currentDescription}`);
        }
      }
    });
  };

  const onSubmit = (data: NewJobFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v));
        } else if (value) {
          formData.append(key, value);
        }
      });

      try {
        const res = await createNewJob(formData);
        if (res?.errors) {
          toast({ variant: 'destructive', title: 'Error Creating Job', description: 'Please check the form for errors and try again.' });
        } else {
          toast({ title: 'Success', description: 'New job has been created successfully.' });
          router.push('/dashboard');
        }
      } catch (e) {
        toast({ variant: 'destructive', title: 'Submission Error', description: 'An unexpected error occurred. Please try again.' });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto pb-20">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Job Details</span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGetAIAssistance}
                        disabled={isAiPending}
                        >
                        {isAiPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="mr-2 h-4 w-4 text-primary" />
                        )}
                        AI Triage
                    </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="issueDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Fan is loud and it won't read discs. Customer says it started after a power surge..."
                          {...field}
                          rows={6}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Smartphone size={20} className="text-primary" /> Device Information</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deviceSerial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="SN12345678" {...field} className="font-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deviceModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., PlayStation 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
             <Card>
                <CardHeader><CardTitle>Triage Results</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={form.control}
                        name="urgency"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Urgency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select urgency level" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {(['low', 'medium', 'high'] as JobUrgency[]).map(level => (
                                    <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <Controller
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                                <div className="p-2 border rounded-md min-h-[40px] flex flex-wrap gap-2 items-center">
                                    {field.value.map((tag, index) => (
                                        <Badge key={`${tag}-${index}`} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {field.value.length === 0 && <span className="text-sm text-muted-foreground italic px-2">Use AI Triage to generate tags.</span>}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
             </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User size={20} className="text-primary"/> Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123-456-7890" {...field} />
                      </FormControl>
                      <FormDescription>We'll check for existing customers.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 border-t border-border backdrop-blur-sm z-20 flex justify-end">
          <Button type="submit" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Job
          </Button>
        </div>
      </form>
    </Form>
  );
}

    