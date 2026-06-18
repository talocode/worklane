import { Response } from './types.js';

export class Formatter {
  static formatResponse(response: Response): string {
    if (!response.success) {
      return `Error: ${response.error}`;
    }

    if (typeof response.data === 'string') {
      return response.data;
    }

    if (typeof response.data === 'object') {
      return JSON.stringify(response.data, null, 2);
    }

    return String(response.data);
  }

  static formatSummary(data: {
    summary: string;
    decisions: string[];
    openQuestions: string[];
    nextActions: { action: string; owner?: string }[];
  }): string {
    let output = '## Summary\n\n';
    output += `${data.summary}\n\n`;

    if (data.decisions.length > 0) {
      output += '## Decisions\n\n';
      data.decisions.forEach(d => {
        output += `- ${d}\n`;
      });
      output += '\n';
    }

    if (data.openQuestions.length > 0) {
      output += '## Open Questions\n\n';
      data.openQuestions.forEach(q => {
        output += `- ${q}\n`;
      });
      output += '\n';
    }

    if (data.nextActions.length > 0) {
      output += '## Next Actions\n\n';
      data.nextActions.forEach(a => {
        output += `- ${a.action}`;
        if (a.owner) {
          output += ` (${a.owner})`;
        }
        output += '\n';
      });
    }

    return output;
  }

  static formatLaunchPlan(data: {
    checklist: string[];
    xPosts: string[];
    githubReleaseTasks: string[];
    demoVideoTasks: string[];
  }): string {
    let output = '## Launch Plan\n\n';

    if (data.checklist.length > 0) {
      output += '### Checklist\n\n';
      data.checklist.forEach(item => {
        output += `- [ ] ${item}\n`;
      });
      output += '\n';
    }

    if (data.xPosts.length > 0) {
      output += '### X Posts\n\n';
      data.xPosts.forEach(post => {
        output += `- ${post}\n`;
      });
      output += '\n';
    }

    if (data.githubReleaseTasks.length > 0) {
      output += '### GitHub Release Tasks\n\n';
      data.githubReleaseTasks.forEach(task => {
        output += `- [ ] ${task}\n`;
      });
      output += '\n';
    }

    if (data.demoVideoTasks.length > 0) {
      output += '### Demo Video Tasks\n\n';
      data.demoVideoTasks.forEach(task => {
        output += `- [ ] ${task}\n`;
      });
    }

    return output;
  }
}
