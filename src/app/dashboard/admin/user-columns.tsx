"use client";

import { Button } from "@/components/ui/button";
import { UserWithGroups, groupEnum } from "@/lib/db/schema";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { LoaderIcon, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Group, groupNames, roleNames } from "@/lib/constants";
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTransition } from "react";
import { updateUserAction } from "./actions";
import { useRouter } from "next/navigation";

const userFormSchema = z.object({
  groups: z.enum(groupEnum.enumValues).array(),
  role: z.enum(["admin", "leader"]).nullable(),
});

const ViewDetailsButton = ({ user }: { user: UserWithGroups }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      groups: user.groups.map((group) => group.group),
      role: user.role,
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const { result } = await updateUserAction(user.id, data);

      if (result === "success") {
        form.reset();
        toast({
          title: "Bruker oppdatert!",
          description: "Brukeren ble oppdatert.",
        });
      }

      if (result === "error") {
        toast({
          title: "Noe gikk galt!",
          description: "Kunne ikke oppdatere brukeren.",
        });
      }

      router.refresh();
    });
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Se detaljer
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Detaljer for {user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="mb-2">
            <Label>Navn</Label>
            <p className="text-sm text-slate-500">{user.name}</p>
          </div>

          <div className="mb-2">
            <Label>E-post</Label>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="mb-4">
                      <FormLabel>Rolle</FormLabel>
                      <FormDescription>
                        Velg hvilken rolle brukeren skal ha.
                      </FormDescription>
                    </div>

                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value as string}
                        className="flex flex-col space-y-1"
                      >
                        {Object.entries(roleNames).map(([id, label]) => (
                          <FormItem
                            key={id}
                            className="flex items-center space-x-3 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={id} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {label}
                            </FormLabel>
                          </FormItem>
                        ))}
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={""} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Ingen rolle
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="groups"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Undergrupper</FormLabel>
                      <FormDescription>
                        Velg de undergruppene brukeren er en del av.
                      </FormDescription>
                    </div>

                    {Object.entries(groupNames).map(([id, label]) => (
                      <FormField
                        key={id}
                        control={form.control}
                        name="groups"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(id as Group)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                )}
                <span>Lagre</span>
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const columns: Array<ColumnDef<UserWithGroups>> = [
  {
    accessorKey: "name",
    header: "Navn",
  },
  {
    accessorKey: "email",
    header: "E-post",
  },
  {
    accessorKey: "role",
    header: "Rolle",
    cell: ({ row }) => {
      const user = row.original;

      return <span>{user.role ? roleNames[user.role] : "Ingen"}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ViewDetailsButton user={user} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
