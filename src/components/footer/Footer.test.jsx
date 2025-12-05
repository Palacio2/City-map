import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer', () => {
  it('renders the footer with correct content', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    // Check for the main heading
    expect(screen.getByText('GeoAnalyzer')).toBeInTheDocument();

    // Check for navigation links
    expect(screen.getByRole('link', { name: 'Головна' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Про проект' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Контакти' })).toBeInTheDocument();

    // Check for contact information
    expect(screen.getByText('email: info@geoanalyzer.com')).toBeInTheDocument();
    expect(screen.getByText('тел: +380 00 000 00 00')).toBeInTheDocument();

    // Check for copyright notice
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} GeoAnalyzer. Всі права захищені.`)).toBeInTheDocument();
  });
});
