import { AppDataSource } from '../config/database.js';
import { Post } from '../entities/Post.js';

async function updatePosts() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    const postRepository = AppDataSource.getRepository(Post);
    
    // First, update any null titles to a default value
    await postRepository.query(`UPDATE posts SET title = 'Untitled Post' WHERE title IS NULL`);
    console.log('Updated null titles');

    // Get all posts to verify
    const posts = await postRepository.find();
    console.log(`Total posts: ${posts.length}`);
    
    for (const post of posts) {
      console.log(`Post ${post.id}: ${post.title}`);
    }

    console.log('All posts updated successfully');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error updating posts:', error);
    process.exit(1);
  }
}

updatePosts(); 