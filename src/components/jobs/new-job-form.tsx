'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAIAssistance } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, X, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobUrgency } from '@/lib/types';
import { createNewJob } from '@/lib/actions';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerEmail: z.string().email('Invalid email address'),
  deviceSerial: z.string().min(1, 'Device serial is required'),
  deviceModel: z.string().min(1, 'Device model is required'),
  issueDescription: z.string().min(10, 'Please provide a detailed description'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  urgency: z.enum(['low', 'medium', 'high'], { required_error: 'Urgency is required' }),
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

  const { fields: tags, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags',
  });

  const handleGetAIAssistance = () => {
    const description = form.getValues('issueDescription');
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
        // Clear existing tags and add new ones
        form.setValue('tags', result.data.tags);
      }
    });
  };

  const onSubmit = (data: NewJobFormValues) => {
    startTransition(() => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => formData.append(key, v));
            } else {
                formData.append(key, value);
            }
        });

        createNewJob(formData)
        .then((res) => {
          if (res?.errors) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please check the form for errors.' });
          } else {
            toast({ title: 'Success', description: 'New job created successfully.' });
            router.push('/dashboard');
          }
        })
        .catch(() => {
          toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong.' });
        });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <FormField
                    control={form.control}
                    name="issueDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., The phone screen is cracked and doesn't respond to touch..." {...field} rows={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={handleGetAIAssistance}
                    disabled={isAiPending}
                  >
                    {isAiPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4 text-primary" />
                    )}
                    AI Assist
                  </Button>
                </div>
                 <FormField
                    control={form.control}
                    name="tags"
                    render={() => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                         <FormControl>
                            <div className="p-2 border rounded-md min-h-[40px] flex flex-wrap gap-2 items-center">
                                {tags.map((tag, index) => (
                                    <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                                        {form.getValues(`tags.${index}`)}
                                        <button type="button" onClick={() => removeTag(index)} className="rounded-full hover:bg-muted-foreground/20">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {tags.length === 0 && <span className="text-sm text-muted-foreground italic px-2">Use AI Assist or add tags manually.</span>}
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
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deviceSerial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="SN12345678" {...field} className="font-code"/>
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
                        <Input placeholder="e.g., iPhone 14 Pro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Urgency</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
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
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123-456-7890" {...field} />
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
        <div className="flex justify-end">
          <Button type="submit" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPending}>
             {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Job
          </Button>
        </div>
      </form>
    </Form>
  );
}
