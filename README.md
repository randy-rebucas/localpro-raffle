# 🎉 LocalPro Raffle System

A modern, gamified raffle application built with Next.js, React, Tailwind CSS, and Prisma. Perfect for organizing and managing raffles with multiple prize tiers, public result sharing, and email notifications.

## ✨ Features

### 🎮 Gamified Draw Experience
- **Spinning Animation**: Watch participants spin in a grid during the draw
- **Zoom Focus Effect**: Selected winners zoom into focus with celebration styling
- **Progressive Winners**: Watch winners get added to your results list
- **Confetti Celebration**: 🎉 Animated confetti and glow effects
- **Automatic Progression**: Smoothly transitions between prize tiers

### 👤 Multi-User Authentication
- Email/password registration and login
- JWT-based sessions with 30-day expiry
- Route protection with middleware
- Secure password hashing with bcryptjs

### 💰 Prize Management
- Multiple prize tier configurations
- Customize winner count per tier
- Philippine Peso (₱) currency formatting
- Tier ordering and management

### 📊 Advanced Analytics
- Comprehensive raffle statistics
- Winners by tier with distribution charts
- Participation rate calculations
- Average prize per winner metrics
- Winner timeline visualization
- Prize pool analysis with visual indicators
- Print-friendly reports

### 📋 Raffle Templates
- Save and reuse tier configurations
- Create multiple templates for quick setup
- Edit/delete saved templates
- Template cloning for rapid raffle creation

### 🔗 Public Result Sharing
- Generate unique shareable links for raffle results
- View results without login authentication
- Stats cards showing winner count and prize pool
- Expandable tier results with winner ranking
- Perfect for social media sharing

### 📧 Email Notifications
- Send winner notification emails via Resend API
- Professionally formatted HTML emails
- Prize details and winner information
- Beautiful email templates with branding
- Batch email sending with error handling

### 📥 CSV Export
- Export all winners to CSV format
- Tier information included
- Perfect for record keeping and analysis

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.3 with Turbopack
- **UI**: React 18 with Tailwind CSS 3
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v4.24.13
- **Email**: Resend API
- **Password Hashing**: bcryptjs
- **Language**: TypeScript

## 📋 System Requirements

- Node.js 18+ 
- npm or yarn
- SQLite 3 (included with Prisma)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd localpro-raffle

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### 2. Environment Setup

Create `.env.local` file in the project root:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=generate_a_random_string_here
NEXTAUTH_URL=http://localhost:3000

# Email Service (Optional - for winner notifications)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
# Apply Prisma migrations
npx prisma db push

# (Optional) View database with Prisma Studio
npx prisma studio
```

### 4. Create Demo User (Optional)

The system comes with a demo user. When the app is already running, you can create additional users via the signup page or use the demo credentials:

- **Email**: demo@example.com
- **Password**: demo123456

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📖 Usage Guide

### Creating a Raffle

1. Go to homepage and click **"New Raffle"**
2. Enter raffle title and description
3. Click **"Create"**
4. On Setup page, add prize tiers:
   - Prize name (e.g., "Grand Prize")
   - Amount in ₱
   - Number of winners
5. Add participants:
   - Enter names (one per line or comma-separated)
   - Optionally add email for notifications
6. Click **"Start Draw"** to begin the gamified drawing

### Using Templates

1. Click **"📋 Templates"** from home page
2. Click **"➕ New Template"**
3. Configure your standard prize tiers
4. Save the template
5. When creating raffles, click **"Use Template"** to auto-populate tiers

### Drawing Winners

1. From Setup page, click **"Start Draw"**
2. Watch the gamified drawing experience:
   - Participants spin in the grid
   - Winners are highlighted with zoom effect
   - Confetti celebrates each winner
3. Once complete, view results automatically

### Share Results

1. On Results page, click **"🔗 Share Results"**
2. Copy the public share link
3. Share with anyone - no login required to view
4. Results include winner list, tier info, and statistics

### Send Winner Notifications

1. Ensure participants have email addresses
2. On Results page, click **"📧 Send Emails"**
3. System sends professionally formatted notification emails
4. Emails include prize details and draw information

*Note: Requires RESEND_API_KEY in environment variables. If not configured, a warning appears.*

### Analyze Results

1. On Results page, click **"📊 Analytics"**
2. View comprehensive statistics:
   - Participation rates
   - Prize distribution
   - Winner timeline
   - Average prize amounts
   - Distribution by tier
3. Click **"🖨️ Print Report"** for printable version

### Export Data

1. On Results page, click **"📥 Export CSV"**
2. Downloads winner list with all details
3. Perfect for record keeping

## 🎨 UI Components & Styling

### Custom Tailwind Animations

- `animate-zoom-in`: Winner announcement zoom effect
- `animate-zoom-out`: Scale down animation
- `animate-pulse-glow`: Glowing ring effect
- `animate-bounce`: Participant spinning effect

### Responsive Design

- Fully responsive from mobile to desktop
- Adaptive grid layouts
- Touch-friendly UI controls
- Optimized for all screen sizes

## 🔒 Security Features

- **JWT Authentication**: Secure token-based sessions
- **Password Hashing**: bcryptjs with salt rounds
- **Route Protection**: Middleware checks for auth tokens
- **CORS & Headers**: NextAuth.js security defaults
- **User Ownership**: Each user only sees their raffles
- **Public Sharing**: Unique share keys prevent unauthorized access

## 📱 API Endpoints

### Raffles
- `GET /api/raffles` - List user's raffles
- `POST /api/raffles` - Create raffle
- `GET /api/raffles/[id]` - Get raffle details
- `PUT /api/raffles/[id]` - Update raffle
- `DELETE /api/raffles/[id]` - Delete raffle

### Participants
- `GET /api/raffles/[id]/participants` - List participants
- `POST /api/raffles/[id]/participants` - Add participants

### Tiers
- `GET /api/raffles/[id]/tiers` - List tiers
- `POST /api/raffles/[id]/tiers` - Create tier
- `PUT /api/raffles/[id]/tiers` - Update tier
- `DELETE /api/raffles/[id]/tiers` - Delete tier

### Draw & Results
- `POST /api/raffles/[id]/draw` - Execute drawing
- `GET /api/raffles/[id]/winners` - Get results
- `GET /api/raffles/[id]/analytics` - Get statistics
- `GET /api/raffles/[id]/export` - Export CSV

### Sharing
- `POST /api/raffles/[id]/share` - Generate share link
- `GET /api/raffles/share/[key]` - Get public results
- `POST /api/raffles/[id]/send-emails` - Send winner emails

### Templates
- `GET /api/templates` - List user's templates
- `POST /api/templates` - Create template
- `GET /api/templates/[id]` - Get template details
- `PUT /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/auth/signup` - Register new user

## 📊 Database Schema

### User
- Email (unique)
- Hashed password
- Name
- Created date
- Relations: Raffles, Templates

### Raffle
- Title & description
- Status (DRAFT, ACTIVE, DRAWN)
- Created by (User FK)
- Draw date
- Relations: Tiers, Participants, Winners, Shares

### Tier
- Prize name & amount (Decimal)
- Winner count
- Tier order
- Relations: Raffle, Winners

### Participant
- Name & email
- Raffle (FK)
- Added date
- Relations: Winners

### Winner
- Participant & Tier (FKs)
- Drawn at timestamp
- Email sent flag
- Relations: Raffle, Tier, Participant

### Template
- Name & description
- Tiers (JSON)
- User (FK)
- Created/updated dates

### RaffleShare
- Share key (unique)
- Raffle (FK)
- Created date

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Kill the process on port 3000
lsof -ti :3000 | xargs kill -9

# Or use an alternative port
npm run dev -- -p 3001
```

### Database connection issues
```bash
# Reset database (removes all data)
npx prisma db push --force-reset

# Verify database schema
npx prisma db validate
```

### Email not sending
- Verify `RESEND_API_KEY` is set in `.env.local`
- Check participant has email addresses
- Allow 5-10 seconds for Resend API to deliver
- Check browser console for any error messages

### Prisma type errors
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

## 📦 Building for Production

```bash
# Build optimized bundle
npm run build

# Start production server
npm run start
```

## 🌐 Deployment Options

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Other Platforms
Supports deployment to any Node.js hosting:
- AWS Amplify
- Netlify (with serverless functions)
- Railway
- Render
- Fly.io

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the development team.

---

**Happy Raffling! 🎊**
