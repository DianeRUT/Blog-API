import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Post } from './Post.js';
import { Token } from './Token.js';

export enum UserRole {
  ADMIN = 'admin',
  AUTHOR = 'author',
  USER = 'user'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role!: UserRole;

  @OneToMany(() => Post, post => post.author)
  posts!: Post[];

  @OneToMany(() => Token, (token: Token) => token.user)
  tokens!: Token[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async hashPassword(): Promise<void> {
    this.password = await bcrypt.hash(this.password, 10);
  }
} 