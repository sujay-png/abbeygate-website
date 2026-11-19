import { describe, it, expect, vi } from 'vitest';
import { generateGoogleMerchantXml } from './google-feed';
import type { StoreProduct } from '../types/store-product';

describe('Google Merchant Center Feed Generator', () => {
  const mockProducts: StoreProduct[] = [
    {
      id: 101,
      name: 'Richmond A5 Leather Diary & Notebook',
      slug: 'richmond-a5-leather-diary',
      permalink: 'https://dashboard.abbeygate-business.com/product/richmond-a5-leather-diary',
      sku: 'RCH-A5-BLK',
      short_description: '<p>A <strong>luxury</strong> corporate diary for 2027.</p>',
      description: '<p>Full descriptions with <span>rich formatting</span> & special chars.</p>',
      on_sale: false,
      prices: {
        price: '1550', // £15.50
        regular_price: '1550',
        sale_price: '1550',
        currency_code: 'GBP',
        currency_symbol: '£',
        currency_minor_unit: 2,
      },
      price_html: '',
      images: [
        {
          id: 1,
          src: 'https://dashboard.abbeygate-business.com/wp-content/uploads/richmond.jpg',
          thumbnail: '',
          alt: 'Richmond diary',
          name: '',
        },
        {
          id: 2,
          src: 'https://dashboard.abbeygate-business.com/wp-content/uploads/richmond-detail.jpg',
          thumbnail: '',
          alt: 'Detail view',
          name: '',
        },
      ],
      categories: [
        { id: 1, name: 'Diaries', slug: 'diaries', link: '' },
        { id: 2, name: 'A5 Diaries', slug: 'a5-diaries', link: '' },
      ],
      tags: [],
      attributes: [],
      is_purchasable: true,
      is_in_stock: true,
      average_rating: '5',
      review_count: 3,
    },
    {
      id: 102,
      name: 'Eco Harrogate Wirebound Notebook',
      slug: 'eco-harrogate-notebook',
      permalink: 'https://dashboard.abbeygate-business.com/product/eco-harrogate-notebook',
      sku: 'ECO-HAR-NTB',
      short_description: 'Sustainable notebook with recycled paper.',
      description: 'Sustainable notebook.',
      on_sale: true,
      prices: {
        price: '1200',
        regular_price: '1600',
        sale_price: '1200',
        currency_code: 'GBP',
        currency_symbol: '£',
        currency_minor_unit: 2,
      },
      price_html: '',
      images: [
        {
          id: 3,
          src: '//dashboard.abbeygate-business.com/wp-content/uploads/eco.jpg',
          thumbnail: '',
          alt: '',
          name: '',
        },
      ],
      categories: [
        { id: 3, name: 'Notebooks', slug: 'notebooks', link: '' },
      ],
      tags: [],
      attributes: [],
      is_purchasable: true,
      is_in_stock: false,
      average_rating: '0',
      review_count: 0,
    },
    {
      id: 103,
      name: 'Zero Price Test Item',
      slug: 'zero-price',
      permalink: '',
      sku: 'ZERO',
      short_description: '',
      description: '',
      on_sale: false,
      prices: {
        price: '0',
        regular_price: '0',
        sale_price: '0',
        currency_code: 'GBP',
        currency_symbol: '£',
        currency_minor_unit: 2,
      },
      price_html: '',
      images: [],
      categories: [],
      tags: [],
      attributes: [],
      is_purchasable: true,
      is_in_stock: true,
      average_rating: '0',
      review_count: 0,
    },
  ];

  it('generates valid Google Merchant Center RSS 2.0 XML', () => {
    const xml = generateGoogleMerchantXml(mockProducts, 'https://abbeygate-england.co.uk');

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain('<channel>');
    expect(xml).toContain('<title>Abbeygate Business</title>');
    expect(xml).toContain('<link>https://abbeygate-england.co.uk</link>');
  });

  it('correctly maps product attributes with proper URLs, prices and stock', () => {
    const xml = generateGoogleMerchantXml(mockProducts, 'https://abbeygate-england.co.uk');

    // Product 101 checks
    expect(xml).toContain('<g:id>101</g:id>');
    expect(xml).toContain('<g:title><![CDATA[Richmond A5 Leather Diary & Notebook]]></g:title>');
    expect(xml).toContain('<g:link>https://abbeygate-england.co.uk/product/richmond-a5-leather-diary</g:link>');
    expect(xml).toContain('<g:image_link>https://dashboard.abbeygate-business.com/wp-content/uploads/richmond.jpg</g:image_link>');
    expect(xml).toContain('<g:additional_image_link>https://dashboard.abbeygate-business.com/wp-content/uploads/richmond-detail.jpg</g:additional_image_link>');
    expect(xml).toContain('<g:availability>in_stock</g:availability>');
    expect(xml).toContain('<g:price>15.50 GBP</g:price>');
    expect(xml).toContain('<g:brand>Abbeygate Business</g:brand>');
    expect(xml).toContain('<g:condition>new</g:condition>');
    expect(xml).toContain('<g:identifier_exists>no</g:identifier_exists>');
    expect(xml).toContain('<g:mpn>RCH-A5-BLK</g:mpn>');
    expect(xml).toContain('<g:shipping>');
    expect(xml).toContain('<g:price>15.75 GBP</g:price>');
    expect(xml).toContain('<g:country>GB</g:country>');

    // Google category for diary
    expect(xml).toContain('Calendars, Organizers & Planners');

    // HTML stripping in description
    expect(xml).not.toContain('<p>');
    expect(xml).not.toContain('<strong>');
  });

  it('correctly handles sale price and out-of-stock products', () => {
    const xml = generateGoogleMerchantXml(mockProducts, 'https://abbeygate-england.co.uk');

    // Product 102 checks
    expect(xml).toContain('<g:id>102</g:id>');
    expect(xml).toContain('<g:availability>out_of_stock</g:availability>');
    expect(xml).toContain('<g:price>16.00 GBP</g:price>');
    expect(xml).toContain('<g:sale_price>12.00 GBP</g:sale_price>');
    // Protocol-relative image URL normalized to https
    expect(xml).toContain('<g:image_link>https://dashboard.abbeygate-business.com/wp-content/uploads/eco.jpg</g:image_link>');
  });

  it('excludes invalid products like zero-price items', () => {
    const xml = generateGoogleMerchantXml(mockProducts, 'https://abbeygate-england.co.uk');

    expect(xml).not.toContain('<g:id>103</g:id>');
    expect(xml).not.toContain('Zero Price Test Item');
  });
});
