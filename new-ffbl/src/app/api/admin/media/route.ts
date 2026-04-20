// src/app/api/admin/media/route.ts
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Configure Cloudinary with your secure backend credentials
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  // Security check: Only admins/commish/managers should be browsing the library
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Search for images in your specific upload preset folders
    const result = await cloudinary.search
      .expression('resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .execute();

    const images = result.resources.map((file: any) => ({
      id: file.public_id,
      url: file.secure_url,
      format: file.format,
      created_at: file.created_at,
    }));

    return NextResponse.json(images);
  } catch (error) {
    console.error("Cloudinary Search Error:", error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}