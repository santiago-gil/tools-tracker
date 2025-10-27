import { createFileRoute } from '@tanstack/react-router';
import { ToolList } from '../components/tools/ToolList';

export const Route = createFileRoute('/_authenticated/tools')({
  component: ToolList,
});
