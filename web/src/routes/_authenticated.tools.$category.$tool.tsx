import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ToolList } from '../components/tools/ToolList';

export const Route = createFileRoute('/_authenticated/tools/$category/$tool')({
  component: ToolList,
  validateSearch: z.object({
    v: z.string().optional(), // version query param
  }),
});
