"use client";

import React, { useEffect, useRef } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface AIAgent {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  targetX: number;
  targetY: number;
  connections: AIAgent[];
  status: 'idle' | 'calling' | 'transferring';
  callAnimation: number;
  messages: Message[];
  role: 'agent' | 'customer' | 'supervisor';
}

interface Message {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  text: string;
  alpha: number;
  size: number;
  speed: number;
  color: string;
}

const MESSAGES = [
  'Hello! How can I help?',
  'Processing request...',
  'Analyzing data...',
  'Transferring call...',
  'AI Assistant active',
  'Customer support',
  'Call in progress',
  '✓ Resolution found',
  '⚡ Quick response',
  '♫ Voice analysis'
];

const ROLES = {
  agent: {
    color: '#7C3AED',
    size: 20
  },
  customer: {
    color: '#EC4899',
    size: 16
  },
  supervisor: {
    color: '#3B82F6',
    size: 24
  }
};

export const LoginScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<AIAgent[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize AI agents
    agentsRef.current = Array.from({ length: 12 }, (_, i) => {
      const role = i < 4 ? 'agent' : i < 10 ? 'customer' : 'supervisor';
      return {
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        ...ROLES[role],
        speed: 0.5 + Math.random() * 1,
        targetX: Math.random() * CANVAS_WIDTH,
        targetY: Math.random() * CANVAS_HEIGHT,
        connections: [],
        status: 'idle',
        callAnimation: 0,
        messages: [],
        role
      };
    });

    // Create connections between agents and customers
    agentsRef.current.forEach(agent => {
      if (agent.role === 'agent') {
        const customers = agentsRef.current.filter(a => a.role === 'customer');
        agent.connections = customers
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
      }
    });

    const createMessage = (from: AIAgent, to: AIAgent) => {
      const message: Message = {
        x: from.x,
        y: from.y,
        targetX: to.x,
        targetY: to.y,
        text: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        alpha: 1,
        size: 12,
        speed: 2 + Math.random() * 2,
        color: from.color
      };
      from.messages.push(message);
    };

    const drawAgent = (agent: AIAgent) => {
      ctx.save();
      ctx.translate(agent.x, agent.y);

      // Draw connection rings when calling
      if (agent.status !== 'idle') {
        ctx.strokeStyle = `${agent.color}40`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const radius = agent.size + 10 + (agent.callAnimation + i * 10) % 30;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw agent body
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, agent.size);
      gradient.addColorStop(0, `${agent.color}FF`);
      gradient.addColorStop(1, `${agent.color}80`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, agent.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw role indicator
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = agent.role === 'agent' ? '🤖' : agent.role === 'customer' ? '👤' : '👑';
      ctx.fillText(icon, 0, 0);

      ctx.restore();
    };

    const drawConnections = (agent: AIAgent) => {
      agent.connections.forEach(other => {
        // const dx = other.x - agent.x;
        // const dy = other.y - agent.y;
        // const dist = Math.hypot(dx, dy);
        // const alpha = Math.max(0, 1 - dist / 400);

        // Draw connection line
        ctx.strokeStyle = `${agent.color}40`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(agent.x, agent.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Randomly initiate calls
        if (Math.random() < 0.01 && agent.status === 'idle') {
          agent.status = 'calling';
          createMessage(agent, other);
        }
      });
    };

    const updateAgent = (agent: AIAgent) => {
      // Move towards target
      const dx = agent.targetX - agent.x;
      const dy = agent.targetY - agent.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 1) {
        agent.targetX = Math.random() * CANVAS_WIDTH;
        agent.targetY = Math.random() * CANVAS_HEIGHT;
      } else {
        agent.x += (dx / dist) * agent.speed;
        agent.y += (dy / dist) * agent.speed;
      }

      // Update call animation
      if (agent.status !== 'idle') {
        agent.callAnimation += 1;
      }

      // Update messages
      agent.messages = agent.messages.filter(msg => {
        const dx = msg.targetX - msg.x;
        const dy = msg.targetY - msg.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < msg.speed) {
          msg.alpha -= 0.1;
          return msg.alpha > 0;
        }

        msg.x += (dx / dist) * msg.speed;
        msg.y += (dy / dist) * msg.speed;
        return true;
      });

      // Reset status if no active messages
      if (agent.messages.length === 0) {
        agent.status = 'idle';
        agent.callAnimation = 0;
      }
    };

    const drawMessages = (agent: AIAgent) => {
      agent.messages.forEach(msg => {
        ctx.save();
        ctx.globalAlpha = msg.alpha;
        ctx.font = `${msg.size}px monospace`;
        ctx.fillStyle = msg.color;
        ctx.textAlign = 'center';
        ctx.fillText(msg.text, msg.x, msg.y);
        ctx.restore();
      });
    };

    const animate = () => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid background
      ctx.strokeStyle = '#7c3aed10';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Update and draw agents
      agentsRef.current.forEach(agent => {
        updateAgent(agent);
        drawConnections(agent);
      });

      agentsRef.current.forEach(agent => {
        drawAgent(agent);
        drawMessages(agent);
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-2xl shadow-lg"
      />
    </div>
  );
};