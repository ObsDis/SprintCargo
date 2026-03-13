"use client";

import { useEffect, useState, useCallback } from "react";
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type {
  SupportTicket,
  SupportMessage,
  SupportTicketStatus,
} from "@/types/database";

type TicketWithMessages = SupportTicket & { messages?: SupportMessage[] };

export default function ContactSupportPage() {
  const [tickets, setTickets] = useState<TicketWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    setTickets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function loadMessages(ticketId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, messages: data || [] } : t
      )
    );
  }

  async function handleCreateTicket() {
    if (!userId || !newSubject.trim() || !newMessage.trim()) return;
    setSubmitting(true);
    const supabase = createClient();

    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userId,
        subject: newSubject.trim(),
        message: newMessage.trim(),
      })
      .select()
      .single();

    if (!error && ticket) {
      // Add initial message
      await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: userId,
        message: newMessage.trim(),
      });

      setNewSubject("");
      setNewMessage("");
      setShowForm(false);
      await loadTickets();
    }
    setSubmitting(false);
  }

  async function handleReply(ticketId: string) {
    if (!userId || !replyText.trim()) return;
    setReplyingTo(ticketId);
    const supabase = createClient();

    await supabase.from("support_messages").insert({
      ticket_id: ticketId,
      sender_id: userId,
      message: replyText.trim(),
    });

    setReplyText("");
    setReplyingTo(null);
    await loadMessages(ticketId);
  }

  async function toggleExpand(ticketId: string) {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
      return;
    }
    setExpandedTicket(ticketId);
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket?.messages) {
      await loadMessages(ticketId);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-52" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">
            Contact Support
          </h1>
          <p className="mt-1 text-muted-foreground">
            Get help with deliveries, payments, or account issues.
          </p>
        </div>
        <Button
          className="bg-[#3B82F6] hover:bg-[#2563EB]"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-[#0F172A]">
              Create Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your issue in detail. Include job IDs or order numbers if applicable..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={5}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-[#3B82F6] hover:bg-[#2563EB]"
                disabled={submitting || !newSubject.trim() || !newMessage.trim()}
                onClick={handleCreateTicket}
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Ticket
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      {tickets.length === 0 && !showForm ? (
        <Card className="rounded-xl shadow-md">
          <CardContent className="py-16 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              No support tickets
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a ticket if you need help with anything.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const isExpanded = expandedTicket === ticket.id;
            return (
              <Card
                key={ticket.id}
                className="overflow-hidden rounded-xl shadow-md"
              >
                <CardContent className="p-0">
                  <div
                    className="flex cursor-pointer items-center justify-between p-4"
                    onClick={() => toggleExpand(ticket.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#0F172A]">
                          {ticket.subject}
                        </p>
                        <TicketStatusBadge status={ticket.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Created {formatRelativeTime(ticket.created_at)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-5 space-y-4">
                      {/* Original message */}
                      <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Original Message
                        </p>
                        <p className="mt-1 text-sm text-[#0F172A]">
                          {ticket.message}
                        </p>
                      </div>

                      {/* Messages thread */}
                      {ticket.messages && ticket.messages.length > 0 && (
                        <div className="space-y-3">
                          <Separator />
                          {ticket.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "rounded-lg p-3",
                                msg.sender_id === userId
                                  ? "ml-8 border bg-white"
                                  : "mr-8 border border-blue-200 bg-blue-50"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground">
                                  {msg.sender_id === userId
                                    ? "You"
                                    : "Support Agent"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(msg.created_at)}
                                </p>
                              </div>
                              <p className="mt-1 text-sm">{msg.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply form */}
                      {ticket.status !== "closed" && (
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Type a reply..."
                            value={
                              expandedTicket === ticket.id ? replyText : ""
                            }
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            className="self-end bg-[#3B82F6] hover:bg-[#2563EB]"
                            disabled={
                              !replyText.trim() ||
                              replyingTo === ticket.id
                            }
                            onClick={() => handleReply(ticket.id)}
                          >
                            {replyingTo === ticket.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TicketStatusBadge({ status }: { status: SupportTicketStatus }) {
  const map: Record<
    SupportTicketStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
  > = {
    open: { label: "Open", variant: "default", className: "bg-blue-600" },
    in_progress: {
      label: "In Progress",
      variant: "default",
      className: "bg-amber-600",
    },
    resolved: {
      label: "Resolved",
      variant: "default",
      className: "bg-emerald-600",
    },
    closed: { label: "Closed", variant: "outline" },
  };
  const info = map[status];
  return (
    <Badge variant={info.variant} className={info.className}>
      {info.label}
    </Badge>
  );
}
