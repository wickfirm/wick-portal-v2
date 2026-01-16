# OMNIXIA AI LEAD QUALIFIER - COMPLETE INTEGRATION PACKAGE

## 📦 WHAT'S INCLUDED

This package contains everything you need to add AI-powered lead qualification to Omnixia:

### 1. **Database Schema** (`omnixia-ai-additions.prisma`)
- 6 new models: AIConfiguration, Conversation, Message, Lead, Booking, ConversationAnalytics
- 3 new enums: ConversationStatus, MessageRole, BookingStatus
- Relations added to existing Agency, User, Client models

### 2. **Dependencies** (`1-DEPENDENCIES.md`)
- @anthropic-ai/sdk (Claude API)
- googleapis (Calendar integration)
- Environment variables needed

### 3. **Core AI Logic** (`/src/lib/ai/`)
- `claude.ts` - Anthropic API client wrapper
- `buildSystemPrompt.ts` - Generates customized prompts based on agency config
- `calculateLeadScore.ts` - BANT framework scoring algorithm

### 4. **API Routes** (`/src/app/api/`)
- `ai/chat/route.ts` - Main conversation endpoint
- More routes needed (conversations, leads, ai-config)

### 5. **UI Components** (`/src/app/lead-qualifier/`)
- `settings/page.tsx` - AI configuration interface
- More pages needed (conversations, leads, analytics)

### 6. **Step-by-Step Guide** (`2-INTEGRATION-STEPS.md`)
- Complete installation instructions
- Troubleshooting tips
- Testing procedures

---

## 🚀 QUICK START (30 MINUTES)

### Step 1: Get Anthropic API Key (5 min)
1. Go to https://console.anthropic.com
2. Sign up (use details from earlier)
3. Create API key
4. Add to `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### Step 2: Update Database (10 min)
```bash
# Open prisma/schema.prisma
# Add content from omnixia-ai-additions.prisma

# Run migration
npx prisma migrate dev --name add_ai_lead_qualifier
npx prisma generate
```

### Step 3: Install Dependencies (2 min)
```bash
npm install @anthropic-ai/sdk googleapis
```

### Step 4: Create Files (10 min)
Copy the provided files to your project:
- `/src/lib/ai/*` files
- `/src/app/api/ai/chat/route.ts`
- `/src/app/lead-qualifier/settings/page.tsx`

### Step 5: Test (3 min)
```bash
npm run dev
# Visit http://localhost:3000/lead-qualifier/settings
```

---

## 📊 ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    Omnixia Frontend                     │
│  /lead-qualifier/* pages (settings, conversations, etc) │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   API Layer (Next.js)                   │
│  /api/ai/chat - Main conversation endpoint              │
│  /api/conversations - List/manage conversations         │
│  /api/leads - Qualified leads management                │
│  /api/ai-config - Configuration CRUD                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   Business Logic                        │
│  buildSystemPrompt() - Generate AI instructions         │
│  calculateLeadScore() - BANT scoring                    │
│  extractLeadData() - Parse conversation data            │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ Claude API    │   │ PostgreSQL    │
│ (Anthropic)   │   │ (Neon)        │
└───────────────┘   └───────────────┘
```

---

## 🗄️ DATABASE STRUCTURE

### New Tables Created:
1. **ai_configurations** - Per-agency AI settings
2. **conversations** - Chat sessions
3. **messages** - Individual messages in conversations
4. **leads** - Qualified leads extracted from conversations
5. **bookings** - Scheduled discovery calls
6. **conversation_analytics** - Performance metrics

### Relationships:
- Agency → hasMany → AIConfiguration, Conversation, Lead, Booking
- Conversation → hasMany → Messages
- Conversation → hasOne → Lead, ConversationAnalytics
- Lead → hasMany → Bookings
- Lead → belongsTo → Client (when converted)

---

## 🎯 HOW IT WORKS

### 1. Agency Configuration
Agency configures AI in `/lead-qualifier/settings`:
- Services offered (SEO, AEO, Web Dev, etc.)
- Target industries (Hospitality, F&B, etc.)
- Minimum budget ($5K/month)
- BANT scoring weights
- Brand voice and case studies

### 2. Lead Visits Website
When a visitor comes to the agency's website:
1. Chat widget appears (embeddable on any site)
2. AI greets them with agency's custom message
3. Natural conversation begins

### 3. AI Qualification Process
As conversation progresses:
1. AI asks BANT questions naturally
2. Extracts: Budget, Authority, Need, Timeline
3. Calculates score (0-100 based on weights)
4. Determines: Qualified / Warm / Cold

### 4. Lead Scoring Example
```
Budget: $10K/month → 30 points (full)
Authority: Marketing Director → 25 points (full)
Need: SEO + Paid Media → 20 points (80% match)
Timeline: 1-3 months → 19 points (75%)
────────────────────────────────
Total Score: 94 / 100 → QUALIFIED ✓
```

### 5. Outcome
- **Score ≥70**: Offer calendar booking (discovery call)
- **Score 42-69**: Collect info, add to nurture
- **Score <42**: Provide resources, polite exit

---

## 💰 COST ANALYSIS

### Anthropic API Pricing:
- Claude Sonnet 4: $3/MTok input, $15/MTok output
- Average conversation: ~2,500 tokens total
- **Cost per conversation: ~$0.015-0.02**

### Monthly Costs (Example):
```
100 conversations/month = ~$2
500 conversations/month = ~$10
1,000 conversations/month = ~$20
5,000 conversations/month = ~$100
```

### ROI for Agencies:
If you charge $397/month per agency:
- Each agency gets ~2,000 conversations included
- Your cost: ~$40/month
- Your margin: $357/month per agency
- **90% margin**

---

## 🎨 CUSTOMIZATION

Each agency's AI is fully customizable:

### Brand Voice
- Professional, Casual, or Consultative tone
- Custom greeting messages
- Agency-specific case studies

### Qualification Criteria
- BANT weights (Budget: 30%, Authority: 25%, etc.)
- Qualification threshold (default 70)
- Minimum budget requirements

### Services & ICP
- Which services to mention (SEO, AEO, etc.)
- Target industries
- Company size focus

---

## 🔐 SECURITY & PRIVACY

### Data Protection
- All conversations stored in your PostgreSQL database
- No data sent to third parties (except Claude API)
- Conversations tied to agency_id (multi-tenant isolation)

### API Key Security
- ANTHROPIC_API_KEY stored in environment variables
- Never exposed to client-side code
- Rate limiting recommended (add middleware)

---

## 📈 METRICS & ANALYTICS

Track performance with built-in analytics:
- Total conversations
- Qualification rate (% that become leads)
- Avg lead score
- Booking conversion rate
- Channel performance (website, SMS, WhatsApp)
- Time-of-day patterns
- Drop-off stages

---

## 🧪 TESTING CHECKLIST

### Phase 1: Database
- [  ] Migration successful
- [  ] New tables visible in Prisma Studio
- [  ] Existing data intact
- [  ] AI config created for The Wick Firm

### Phase 2: API
- [  ] /api/ai/chat responds with 200
- [  ] Conversation saved to database
- [  ] Messages stored correctly
- [  ] Lead created when qualified

### Phase 3: UI
- [  ] /lead-qualifier/settings loads
- [  ] Can save configuration
- [  ] Configuration persists after reload

### Phase 4: Integration
- [  ] Chat widget renders on test page
- [  ] Can have conversation
- [  ] Lead score calculated correctly
- [  ] Booking flow works (when implemented)

---

## 🐛 TROUBLESHOOTING

### "relation already exists" during migration
```bash
npx prisma migrate reset
npx prisma migrate dev --name add_ai_lead_qualifier
```

### Claude API returns 401
- Check ANTHROPIC_API_KEY is set correctly
- Restart dev server after adding env var
- Verify key is active in Anthropic console

### TypeScript errors about Prisma types
```bash
npx prisma generate
# Restart dev server
```

### Chat endpoint returns 500
- Check Prisma connection
- Verify agency has aiConfigurations
- Check Anthropic API key is valid

---

## 🚧 WHAT'S NOT INCLUDED (Yet)

This is an MVP integration. Still needed:

### Phase 2 Features:
- [ ] Conversations list page (`/lead-qualifier/conversations`)
- [ ] Leads list page (`/lead-qualifier/leads`)
- [ ] Analytics dashboard (`/lead-qualifier/analytics`)
- [ ] Chat widget component (embeddable)
- [ ] Google Calendar integration for bookings
- [ ] Multi-channel support (SMS, WhatsApp)
- [ ] API route for /api/ai-config (CRUD)
- [ ] API route for /api/conversations
- [ ] API route for /api/leads

### Phase 3 Features:
- [ ] A/B testing different prompts
- [ ] Webhook integrations
- [ ] Email notifications
- [ ] Lead export/import
- [ ] Conversation templates
- [ ] Custom fields per agency

---

## 📞 NEXT STEPS

### Immediate (After Integration):
1. Test with The Wick Firm internally
2. Refine prompts based on real conversations
3. Build remaining UI pages (conversations, leads)
4. Add calendar integration

### Beta Phase:
1. Invite UDMS and ATC
2. Gather feedback
3. Iterate on UX
4. Add missing features

### Launch:
1. Public availability for all agencies
2. Marketing campaign
3. Onboarding documentation
4. Support system

---

## 💡 TIPS FOR SUCCESS

### 1. Start Simple
- Use default BANT weights first
- Test with your own agency before others
- Refine prompts iteratively

### 2. Monitor Quality
- Review conversation transcripts regularly
- Check if AI is qualifying correctly
- Adjust thresholds based on results

### 3. Train Your AI
- Add real case studies
- Use specific examples
- Update prompts as you learn

### 4. Set Expectations
- AI won't be perfect day 1
- Need ~50 conversations to optimize
- Continuous improvement process

---

## 📚 RESOURCES

- Anthropic Docs: https://docs.anthropic.com
- Prisma Docs: https://www.prisma.io/docs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:
1. ✅ Agency can configure AI in settings
2. ✅ Visitors can chat with AI
3. ✅ Conversations are saved to database
4. ✅ Qualified leads are created automatically
5. ✅ Lead scores match expectations
6. ✅ Agency team can view conversations

---

**Estimated Time to Full MVP: 1-2 weeks**
- Week 1: Database + API + Core logic (done with this package)
- Week 2: UI pages + Chat widget + Testing

**Let's build this! 🚀**
