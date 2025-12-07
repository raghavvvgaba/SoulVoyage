import React, { useState } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { CheckSquare, Copy, CornerUpLeft, Forward, Info, Pin, Smile, Star, Trash2, ChevronDown, Reply, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  isSelected: boolean;
  currentUserId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void; // Opens delete dialog
  onReply: (message: Message) => void;
  onCopy: (text: string) => void;
  onVote: (messageId: string, optionId: string) => void;
  onFullscreen: (url: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onLongPress: (id: string) => void;
  onReact: (message: Message) => void; // Trigger reaction picker
}

export const MessageItem = ({
  message,
  isCurrentUser,
  isSelected,
  currentUserId,
  onSelect,
  onDelete,
  onReply,
  onCopy,
  onVote,
  onFullscreen,
  onContextMenu,
  onLongPress,
  onReact,
}: MessageItemProps) => {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      // Trigger reply
      onReply(message);
    }
    await controls.start({ x: 0 });
  };

  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const renderContent = () => {
    if (message.type === "photo" && message.photoUrl) {
      return (
        <div 
          className="relative group cursor-pointer"
          onClick={() => onFullscreen(message.photoUrl!)}
        >
          <img
            src={message.photoUrl}
            alt="Shared photo"
            className="rounded-lg max-h-64 max-w-xs object-cover hover:opacity-80 transition-opacity"
          />
          {!isCurrentUser && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent rounded-b-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white font-semibold">{message.senderName}</p>
            </div>
          )}
        </div>
      );
    }

    if (message.type === "poll" && message.poll) {
      return (
        <div className="space-y-2 min-w-[200px]">
          {!isCurrentUser && (
            <p className="text-xs font-semibold mb-2">{message.senderName}</p>
          )}
          <p className="font-semibold">{message.poll.title}</p>
          <div className="space-y-2">
            {message.poll.options.map((option) => {
              const totalVotes = message.poll!.options.reduce((sum, opt) => sum + opt.votes.length, 0);
              const optionVotes = option.votes.length;
              const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
              const hasVoted = option.votes.includes(currentUserId || "");
              
              return (
                <button
                  key={option.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(message.id, option.id);
                  }}
                  className={`w-full text-left p-2 rounded transition-all ${
                    hasVoted
                      ? "bg-accent/40 border border-accent"
                      : "bg-accent/20 border border-transparent hover:border-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{option.text}</span>
                    <span className="text-xs">{optionVotes}</span>
                  </div>
                  <div className="h-1 bg-accent/20 rounded mt-1 overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <>
        {!isCurrentUser && !message.deletedForEveryone && (
          <p className="text-xs font-semibold mb-1">{message.senderName}</p>
        )}
        {message.deletedForEveryone ? (
           <p className="italic text-muted-foreground text-sm">This message was deleted by the user</p>
        ) : (
           <p className="break-words">{message.content}</p>
        )}
      </>
    );
  };

  return (
    <div
      className={`relative flex w-full group ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      {/* Drag Background (Reaction) */}
      <div className={`absolute top-0 bottom-0 flex items-center ${isCurrentUser ? "right-full mr-2" : "left-0 -ml-8"} opacity-0 group-hover:opacity-100 transition-opacity`}>
         {/* This is for drag visual if we were doing full swipe, but framer motion handles the drag element. 
             We'll put the "Heart/React" icon behind the message using absolute positioning if needed, 
             but for simple right drag, we often just show the icon appearing.
         */}
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: isCurrentUser ? -100 : 0, right: isCurrentUser ? 0 : 100 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`relative flex gap-2 max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Selection Checkbox */}
        {isSelected && (
          <div className="flex items-center pt-1">
            <div 
              className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/30"
              }`}
              onClick={() => onSelect(message.id)}
            >
              <span className="text-primary-foreground text-xs">✓</span>
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div
          onContextMenu={(e) => onContextMenu(e, message.id)}
          onTouchStart={() => {
            longPressTimerRef.current = setTimeout(() => {
              onLongPress(message.id);
            }, 500);
          }}
          onTouchEnd={() => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }}
          onClick={() => {
            if (isSelected) onSelect(message.id);
          }}
          className={`rounded-lg cursor-pointer transition-all relative ${
             message.type === "photo"
               ? "p-0"
               : `px-4 py-2 ${
                   isCurrentUser
                     ? "bg-primary text-primary-foreground"
                     : "bg-accent/20 text-foreground"
                 }`
           } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
        >
           {/* Reply Icon Indicator (Visible when dragging) */}
           <div 
             className={`absolute top-1/2 -translate-y-1/2 text-primary opacity-0 transition-opacity ${
               isCurrentUser ? "right-[-40px]" : "left-[-40px]"
             }`}
             style={{ opacity: isDragging ? 1 : 0 }}
           >
             <Reply className="w-6 h-6" />
           </div>

           {renderContent()}
           
        </div>

        {/* Hover Dropdown Button */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center ${isCurrentUser ? "mr-2" : "ml-2"}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background/50 hover:bg-background shadow-sm border">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCurrentUser ? "start" : "end"} className="w-48">
                <DropdownMenuItem onClick={() => onReply(message)} className="gap-2">
                  <Reply className="h-4 w-4" /> Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReact(message)} className="gap-2">
                  <Smile className="h-4 w-4" /> React
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <Star className="h-4 w-4" /> Star
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Pin className="h-4 w-4" /> Pin
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Forward className="h-4 w-4" /> Forward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy(message.content || "")} className="gap-2">
                  <Copy className="h-4 w-4" /> Copy
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Info className="h-4 w-4" /> Info
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSelect(message.id)} className="gap-2">
                  <CheckSquare className="h-4 w-4" /> Select messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(message.id)} className="gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

      </motion.div>
    </div>
  );
};
