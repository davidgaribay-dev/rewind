import type { Project, Stats } from './types';
import { format, startOfDay } from 'date-fns';

/**
 * Calculate statistics from all projects
 */
export function calculateStats(projects: Project[]): Stats {
  let totalConversations = 0;
  let totalMessages = 0;
  let userMessageCount = 0;
  let assistantMessageCount = 0;
  let totalTokens = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  const modelDistribution: Record<string, number> = {};
  const dailyActivity: Record<string, number> = {};

  projects.forEach(project => {
    totalConversations += project.conversationCount;

    // Use totalMessages from project metadata if conversations aren't loaded
    if (project.totalMessages && !project.conversations) {
      totalMessages += project.totalMessages;
    }

    // Only process conversations if they're actually loaded
    if (project.conversations && project.conversations.length > 0) {
      project.conversations.forEach(conversation => {
        totalMessages += conversation.messageCount;

        // Count message types (only if messages are loaded)
        if (conversation.messages && conversation.messages.length > 0) {
          conversation.messages.forEach(msg => {
            if (msg.type === 'user') {
              userMessageCount++;
            } else if (msg.type === 'assistant') {
              assistantMessageCount++;
            }
          });
        }

        // Track tokens
        if (conversation.totalTokens) {
          totalTokens += conversation.totalTokens;
        }
        if (conversation.inputTokens) {
          inputTokens += conversation.inputTokens;
        }
        if (conversation.outputTokens) {
          outputTokens += conversation.outputTokens;
        }

        // Track model usage
        if (conversation.model) {
          modelDistribution[conversation.model] =
            (modelDistribution[conversation.model] || 0) + 1;
        }

        // Track daily activity
        const dayKey = format(startOfDay(conversation.timestamp), 'yyyy-MM-dd');
        dailyActivity[dayKey] = (dailyActivity[dayKey] || 0) + 1;
      });
    }
  });

  // Find most used model
  let mostUsedModel = 'Unknown';
  let modelUsageCount = 0;

  Object.entries(modelDistribution).forEach(([model, count]) => {
    if (count > modelUsageCount) {
      mostUsedModel = model;
      modelUsageCount = count;
    }
  });

  // Convert daily activity to timeline data
  const timelineData = Object.entries(dailyActivity)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalConversations,
    totalProjects: projects.length,
    totalMessages,
    userMessageCount,
    assistantMessageCount,
    totalTokens,
    inputTokens,
    outputTokens,
    mostUsedModel,
    modelUsageCount,
    modelDistribution,
    timelineData,
  };
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format model name for display
 */
export function formatModelName(model: string): string {
  // Extract main model name from full identifier
  // e.g., "claude-opus-4-5-20251101" -> "Opus 4.5"
  if (model.includes('opus')) {
    const match = model.match(/opus-(\d)-(\d)/);
    return match ? `Opus ${match[1]}.${match[2]}` : 'Opus';
  }

  if (model.includes('sonnet')) {
    const match = model.match(/sonnet-(\d)-(\d)/);
    return match ? `Sonnet ${match[1]}.${match[2]}` : 'Sonnet';
  }

  if (model.includes('haiku')) {
    const match = model.match(/haiku-(\d)-(\d)/);
    return match ? `Haiku ${match[1]}.${match[2]}` : 'Haiku';
  }

  return model;
}
