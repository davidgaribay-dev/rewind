import { Hono } from 'hono';
import { getDb, schema } from '@/db/client';
import { eq, or, ilike, sql, desc, and } from 'drizzle-orm';
import { isValidId, validateSearchQuery } from '@/utils/validation';
import { SEARCH_CONFIG } from '@/utils/constants';

const app = new Hono();

// GET /conversations/:id - Get conversation with messages
app.get('/:id', async (c) => {
  try {
    const db = getDb();
    const conversationId = c.req.param('id');

    // Validate conversation ID format
    if (!isValidId(conversationId)) {
      return c.json({ error: 'Invalid conversation ID format' }, 400);
    }

    // Try to find by UUID first, then by rewind conversation ID
    let conversation = await db.query.conversations.findFirst({
      where: eq(schema.conversations.id, conversationId),
      with: {
        messages: {
          orderBy: (messages, { asc }) => [asc(messages.timestamp)],
          with: {
            contentBlocks: {
              orderBy: (blocks, { asc }) => [asc(blocks.sequence)],
            },
          },
        },
        project: true,
      },
    });

    // If not found by UUID, try by rewind conversation ID
    if (!conversation) {
      conversation = await db.query.conversations.findFirst({
        where: eq(schema.conversations.conversationId, conversationId),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.timestamp)],
            with: {
              contentBlocks: {
                orderBy: (blocks, { asc }) => [asc(blocks.sequence)],
              },
            },
          },
          project: true,
        },
      });
    }

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    return c.json(conversation);
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

// GET /conversations/search?q=query - Search conversations
app.get('/search', async (c) => {
  try {
    const db = getDb();
    const query = c.req.query('q');
    const projectId = c.req.query('projectId');

    // Validate search query
    const validation = validateSearchQuery(query);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Validate projectId if provided
    if (projectId && !isValidId(projectId)) {
      return c.json({ error: 'Invalid project ID format' }, 400);
    }

    const searchPattern = `%${validation.sanitized}%`;

    // Build where clause using proper parameterized queries with type-safe composition
    const searchConditions = or(
      ilike(schema.conversations.title, searchPattern),
      sql`EXISTS (
        SELECT 1 FROM ${schema.messages}
        WHERE ${schema.messages.conversationId} = ${schema.conversations.id}
        AND ${schema.messages.content} ILIKE ${searchPattern}
      )`
    );

    // Safely add projectId filter if provided
    const whereClause = projectId
      ? and(searchConditions, eq(schema.conversations.projectId, projectId))
      : searchConditions;

    const conversations = await db
      .select({
        id: schema.conversations.id,
        conversationId: schema.conversations.conversationId,
        sessionId: schema.conversations.sessionId,
        title: schema.conversations.title,
        model: schema.conversations.model,
        totalTokens: schema.conversations.totalTokens,
        inputTokens: schema.conversations.inputTokens,
        outputTokens: schema.conversations.outputTokens,
        createdAt: schema.conversations.createdAt,
        updatedAt: schema.conversations.updatedAt,
        projectId: schema.conversations.projectId,
        projectName: schema.projects.name,
      })
      .from(schema.conversations)
      .innerJoin(schema.projects, eq(schema.conversations.projectId, schema.projects.id))
      .where(whereClause)
      .orderBy(desc(schema.conversations.updatedAt))
      .limit(SEARCH_CONFIG.MAX_RESULTS);

    return c.json(conversations);
  } catch (error) {
    console.error('Failed to search conversations:', error);
    return c.json({ error: 'Failed to search conversations' }, 500);
  }
});

export default app;
