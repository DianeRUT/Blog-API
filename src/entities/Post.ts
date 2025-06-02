import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User.js';
import { Comment } from './Comment.js';

export enum PostStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  REJECTED = 'rejected'
}

export enum PostCategory {
  TECHNOLOGY = 'technology',
  LIFESTYLE = 'lifestyle',
  TRAVEL = 'travel',
  FOOD = 'food',
  HEALTH = 'health',
  BUSINESS = 'business',
  OTHER = 'other'
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT
  })
  status!: PostStatus;

  @Column({
    type: 'enum',
    enum: PostCategory,
    default: PostCategory.OTHER
  })
  category!: PostCategory;

  @Column('simple-array', { nullable: true })
  tags!: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  featuredImage!: string;

  @Column({ type: 'int', default: 0 })
  readingTime!: number;

  @Column({ type: 'int', default: 0 })
  views!: number;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slug!: string;

  @Column({ type: 'int' })
  authorId!: number;

  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @OneToMany(() => Comment, comment => comment.post)
  comments!: Comment[];
} 