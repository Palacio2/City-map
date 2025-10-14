import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@header/Header';
import Footer from '@footer/Footer';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}