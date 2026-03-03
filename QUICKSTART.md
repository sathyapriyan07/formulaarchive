# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `database/schema.sql`
6. Click **Run** to create all tables

### Step 3: Get Supabase Credentials

1. Go to **Settings** > **API** in Supabase dashboard
2. Copy your **Project URL**
3. Copy your **anon/public key**

### Step 4: Configure Environment

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎯 Create Your First Admin User

### 1. Sign Up
- Click **Sign Up** in the navigation
- Enter email and password
- Submit the form

### 2. Get Your User ID
- Go to Supabase dashboard
- Navigate to **Authentication** > **Users**
- Copy your user ID

### 3. Make Yourself Admin
- Go to **SQL Editor** in Supabase
- Run this query (replace with your user ID):

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin');
```

### 4. Refresh and Access Admin Panel
- Refresh the website
- Click **Admin** in the navigation
- You now have full admin access!

## 📝 Add Sample Data

### Option 1: Use Sample Data SQL
```sql
-- Run database/sample_data.sql in Supabase SQL Editor
```

### Option 2: Use Admin Panel
1. Go to Admin Dashboard
2. Add a Season (e.g., 2024)
3. Add Teams with logo URLs
4. Add Drivers with image URLs
5. Add Circuits with layout images
6. Add Races
7. Add Race Results

## 🖼️ Image URLs

You can use:
- **Placeholder images**: `https://via.placeholder.com/600x400?text=Your+Text`
- **Unsplash**: `https://source.unsplash.com/600x400/?formula1`
- **Your own CDN**: Upload to Supabase Storage or any CDN
- **Direct URLs**: Any publicly accessible image URL

### Example URLs for Testing:
```
Team Logo: https://via.placeholder.com/200x100?text=Red+Bull
Driver Image: https://via.placeholder.com/300x400?text=Max+Verstappen
Circuit Layout: https://via.placeholder.com/800x400?text=Silverstone
Car Image: https://via.placeholder.com/600x300?text=RB20
```

## 🎨 Customize Theme

Edit `tailwind.config.js` to change colors:

```js
colors: {
  f1: {
    red: '#E10600',      // Main accent color
    dark: '#15151E',     // Card background
    darker: '#0D0D11',   // Page background
    gray: '#38383F',     // Borders
    light: '#F7F4F1',    // Text color
  }
}
```

## 📱 Test Responsive Design

- Desktop: Default view
- Tablet: Resize browser to 768px
- Mobile: Resize browser to 375px

Or use browser DevTools (F12) > Toggle Device Toolbar

## 🔧 Common Issues

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173
npm run dev
```

### Environment Variables Not Loading
- Restart dev server after creating `.env`
- Ensure file is named exactly `.env` (not `.env.txt`)
- Check for typos in variable names

### Database Connection Error
- Verify Supabase URL and key are correct
- Check if Supabase project is active
- Ensure RLS policies are applied

### Admin Panel Not Showing
- Verify user role in `user_roles` table
- Check if user is logged in
- Clear browser cache and refresh

## 📚 Next Steps

1. **Populate Data**: Add real F1 data through admin panel
2. **Customize Design**: Modify colors and layouts
3. **Add Features**: Implement additional functionality
4. **Deploy**: Follow `DEPLOYMENT.md` guide
5. **Share**: Show off your F1 archive!

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Review `database/schema.sql` for database structure
- Inspect browser console for errors
- Check Supabase logs for API issues

## 🎉 You're Ready!

Your Formula 1 Archive website is now running. Start adding data and customizing it to your needs!
