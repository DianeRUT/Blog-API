import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './User.js';

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  token!: string;

  @Column({ type: 'enum', enum: ['verification', 'reset'] })
  type!: 'verification' | 'reset';

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User)
  user!: User;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
} 