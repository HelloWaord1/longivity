/**
 * Longivity — Entry point
 * Initializes knowledge base and runs agents
 */

import { KnowledgeBase } from './kb/store.js';
import { ResearchMonitor } from './agents/research-monitor.js';
import { ProductMonitor } from './agents/product-monitor.js';
import { CommunityMonitor } from './agents/community-monitor.js';

async function main() {
  console.log('🧬 Longivity — Starting up...\n');

  // Initialize Knowledge Base
  const kb = new KnowledgeBase();
  await kb.init();

  const command = process.argv[2] || 'all';

  switch (command) {
    case 'research': {
      const rm = new ResearchMonitor();
      await rm.init();
      const result = await rm.run();
      console.log('\n📊 Research Monitor result:', result);
      break;
    }

    case 'products': {
      const pm = new ProductMonitor();
      await pm.init();
      const result = await pm.run();
      console.log('\n📦 Product Monitor result:', result);
      break;
    }

    case 'community': {
      const cm = new CommunityMonitor();
      await cm.init();
      const result = await cm.run();
      console.log('\n👥 Community Monitor result:', result);
      break;
    }

    case 'all': {
      console.log('Running all agents...\n');

      const pm = new ProductMonitor();
      await pm.init();
      const prodResult = await pm.run();
      console.log('\n📦 Product Monitor:', prodResult);

      const rm = new ResearchMonitor();
      await rm.init();
      const resResult = await rm.run();
      console.log('\n📊 Research Monitor:', resResult);

      const cm = new CommunityMonitor();
      await cm.init();
      const comResult = await cm.run();
      console.log('\n👥 Community Monitor:', comResult);

      console.log('\n✅ All agents completed.');
      break;
    }

    default:
      console.log('Usage: node src/index.js [research|products|community|all]');
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
