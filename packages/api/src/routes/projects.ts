import { Hono } from 'hono';
import { getDb, schema } from '@/db/client';
import { eq, desc, sql } from 'drizzle-orm';
import { isValidId } from '@/utils/validation';

const app = new Hono();

// GET /projects - Get all projects with stats
app.get('/', async (c) => {
  try {
    const db = getDb();

    const projects = await db
      .select({
        id: schema.projects.id,
        name: schema.projects.name,
        path: schema.projects.path,
        createdAt: schema.projects.createdAt,
        conversationCount: sql<number>`count(distinct ${schema.conversations.id})`.as('conversation_count'),
        messageCount: sql<number>`count(${schema.messages.id})`.as('message_count'),
        lastActivity: sql<Date>`max(${schema.messages.timestamp})`.as('last_activity'),
      })
      .from(schema.projects)
      .leftJoin(schema.conversations, eq(schema.projects.id, schema.conversations.projectId))
      .leftJoin(schema.messages, eq(schema.conversations.id, schema.messages.conversationId))
      .groupBy(schema.projects.id)
      .orderBy(desc(sql`max(${schema.messages.timestamp})`));

    return c.json(
      projects.map(p => ({
        ...p,
        conversationCount: Number(p.conversationCount),
        messageCount: Number(p.messageCount),
      }))
    );
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// GET /projects/:id - Get single project
app.get('/:id', async (c) => {
  try {
    const db = getDb();
    const projectId = c.req.param('id');

    // Validate project ID format
    if (!isValidId(projectId)) {
      return c.json({ error: 'Invalid project ID format' }, 400);
    }

    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    });

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// GET /projects/:id/conversations - Get all conversations for a project
app.get('/:id/conversations', async (c) => {
  try {
    const db = getDb();
    const projectId = c.req.param('id');

    // Validate project ID format
    if (!isValidId(projectId)) {
      return c.json({ error: 'Invalid project ID format' }, 400);
    }

    const conversations = await db
      .select({
        id: schema.conversations.id,
        conversationId: schema.conversations.conversationId,
        title: schema.conversations.title,
        createdAt: schema.conversations.createdAt,
        updatedAt: schema.conversations.updatedAt,
        messageCount: sql<number>`count(${schema.messages.id})`.as('message_count'),
      })
      .from(schema.conversations)
      .leftJoin(schema.messages, eq(schema.conversations.id, schema.messages.conversationId))
      .where(eq(schema.conversations.projectId, projectId))
      .groupBy(schema.conversations.id)
      .orderBy(desc(schema.conversations.createdAt));

    return c.json(
      conversations.map(conv => ({
        ...conv,
        messageCount: Number(conv.messageCount),
      }))
    );
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

export default app;
