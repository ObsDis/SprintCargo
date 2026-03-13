"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import type { SupportTicket, SupportMessage, SupportTicketStatus, Job } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Plus,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  User,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";

type TicketWithMessages = SupportTicket & { messages: SupportMessage[] };

const TICKET_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-700" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-500" },
};

export default function ContactSupportPage() {
  const [tickets, setTickets] = useState<TicketWithMessages[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMessages | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // New ticket form
  const [newSubject, setNewSubject] = useState("");
  const [newJobId, setNewJobId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  const fetchData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const [ticketsResult, jobsResult] = await Promise.all([
      supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("jobs").select("id, title").eq("shipper_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);

    const ticketsData = (ticketsResult.data ?? []) as SupportTicket[];
    setJobs((jobsResult.data ?? []) as { id: string; title: string }[]);

    // Fetch messages for all tickets
    const ticketIds = ticketsData.map((t) => t.id);
    let messagesMap: Record<string, SupportMessage[]> = {};
    if (ticketIds.length > 0) {
      const { data: msgs } = await supabase
        .from("support_messages")
        .select("*")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true });
      (msgs ?? []).forEach((m) => {
        const msg = m as SupportMessage;
        if (!messagesMap[msg.ticket_id]) messagesMap[msg.ticket_id] = [];
        messagesMap[msg.ticket_id].push(msg);
      });
    }

    const enriched: TicketWithMessages[] = ticketsData.map((t) => ({
      ...t,
      messages: messagesMap[t.id] ?? [],
    }));

    setTickets(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateTicket = async () => {
    if (!newSubject || !newMessage) {
      toast.error("Please fill in subject and message.");
      return;
    }
    setCreatingTicket(true);
    const supabase = createClient();
    const { data: ticket, error } = await supabase.from("support_tickets").insert({
      user_id: userId,
      subject: newSubject,
      message: newMessage,
      job_id: newJobId || null,
      status: "open" as SupportTicketStatus,
    }).select("*").single();

    if (error) {
      toast.error("Failed to create ticket: " + error.message);
      setCreatingTicket(false);
      return;
    }

    // Also create the first message
    if (ticket) {
      await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: userId,
        message: newMessage,
      });
    }

    toast.success("Support ticket created!");
    setShowNewTicket(false);
    setNewSubject("");
    setNewJobId("");
    setNewMessage("");
    setCreatingTicket(false);
    fetchData();
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setSendingReply(true);
    const supabase = createClient();
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: selectedTicket.id,
      sender_id: userId,
      message: replyMessage,
    });
    if (error) {
      toast.error("Failed to send reply");
      setSendingReply(false);
      return;
    }
    setReplyMessage("");
    setSendingReply(false);
    // Refresh data and keep same ticket selected
    await fetchData();
    const updatedTicket = tickets.find((t) => t.id === selectedTicket.id);
    if (updatedTicket) {
      // Re-fetch to get latest messages
      const supabase2 = createClient();
      const { data: msgs } = await supabase2.from("support_messages").select("*").eq("ticket_id", selectedTicket.id).order("created_at", { ascending: true });
      setSelectedTicket({ ...selectedTicket, messages: (msgs ?? []) as SupportMessage[] });
    }
  };

  // Detail view for a selected ticket
  if (selectedTicket) {
    const badge = TICKET_STATUS_BADGE[selectedTicket.status] ?? { label: selectedTicket.status, className: "bg-gray-100" };
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="gap-1 text-gray-500">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0F172A]">{selectedTicket.subject}</h1>
              <Badge variant="secondary" className={cn("text-xs", badge.className)}>{badge.label}</Badge>
            </div>
            <p className="text-sm text-gray-500">Opened {formatRelativeTime(selectedTicket.created_at)}</p>
          </div>
        </div>

        <Card className="rounded-xl shadow-sm border-0 bg-white">
          <CardContent className="p-5">
            {/* Original message */}
            <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 mb-4">
              <p className="text-xs text-gray-400 mb-1">Original Message</p>
              <p className="text-sm text-[#0F172A]">{selectedTicket.message}</p>
            </div>

            {/* Message thread */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedTicket.messages.map((msg) => {
                const isUser = msg.sender_id === userId;
                return (
                  <div key={msg.id} className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
                    {!isUser && (
                      <div className="h-8 w-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                        <Headphones className="h-4 w-4 text-[#3B82F6]" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[70%] p-3 rounded-lg text-sm",
                      isUser ? "bg-[#3B82F6] text-white rounded-br-sm" : "bg-gray-100 text-[#0F172A] rounded-bl-sm"
                    )}>
                      <p>{msg.message}</p>
                      <p className={cn("text-xs mt-1", isUser ? "text-blue-200" : "text-gray-400")}>
                        {formatDate(msg.created_at, "MMM d, h:mm a")}
                      </p>
                    </div>
                    {isUser && (
                      <div className="h-8 w-8 rounded-full bg-[#0F172A]/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-[#0F172A]/60" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reply input */}
            {!["resolved", "closed"].includes(selectedTicket.status) && (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Input
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || sendingReply}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-1"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Contact Support</h1>
          <p className="text-gray-500 mt-1">Get help with your shipments and account</p>
        </div>
        <Button onClick={() => setShowNewTicket(true)} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2">
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl shadow-sm border-0 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="rounded-xl shadow-sm border-0 bg-white">
          <CardContent className="py-16 text-center">
            <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No support tickets</p>
            <p className="text-sm text-gray-400 mt-1">Need help? Create a new ticket and our team will respond quickly.</p>
            <Button onClick={() => setShowNewTicket(true)} className="mt-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2">
              <Plus className="h-4 w-4" /> New Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const badge = TICKET_STATUS_BADGE[ticket.status] ?? { label: ticket.status, className: "bg-gray-100" };
            const icon = ticket.status === "open" ? AlertCircle
              : ticket.status === "in_progress" ? Clock
              : ticket.status === "resolved" ? CheckCircle2
              : MessageCircle;
            const IconComp = icon;
            return (
              <Card
                key={ticket.id}
                className="rounded-xl shadow-sm border-0 bg-white hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      ticket.status === "open" ? "bg-blue-50" : ticket.status === "in_progress" ? "bg-amber-50" : "bg-green-50"
                    )}>
                      <IconComp className={cn(
                        "h-5 w-5",
                        ticket.status === "open" ? "text-blue-500" : ticket.status === "in_progress" ? "text-amber-500" : "text-green-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F172A] truncate">{ticket.subject}</p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">{ticket.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(ticket.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {ticket.messages.length > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {ticket.messages.length}
                        </span>
                      )}
                      <Badge variant="secondary" className={cn("text-xs", badge.className)}>{badge.label}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="ticketSubject">Subject *</Label>
              <Input
                id="ticketSubject"
                placeholder="Brief summary of your issue"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="relatedShipment">Related Shipment</Label>
              <Select value={newJobId} onValueChange={(val) => setNewJobId(val ?? "")}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a shipment (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ticketMessage">Message *</Label>
              <Textarea
                id="ticketMessage"
                placeholder="Describe your issue in detail..."
                rows={5}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTicket(false)}>Cancel</Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!newSubject || !newMessage || creatingTicket}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {creatingTicket ? "Creating..." : "Submit Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
