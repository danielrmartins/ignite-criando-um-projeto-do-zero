import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useState } from 'react';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';
import commonStyles from '../styles/common.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;
  const [nextPage, setNextPage] = useState(next_page);

  const formattedPost = results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  const [posts, setPosts] = useState(formattedPost);

  function getMorePages(): void {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setNextPage(data.next_page);

        const newPosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
        setPosts([...posts, ...newPosts]);
      });
  }
  return (
    <>
      <Head>
        <title>SpaceTravelling</title>
      </Head>

      <main className={commonStyles.contentContainer}>
        <Header />

        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.info}>
                  <FiCalendar className={commonStyles.calendar} />
                  <time className={commonStyles.date}>
                    {post.first_publication_date}
                  </time>
                  <FiUser className={commonStyles.user} />
                  <span>{post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}
          {!!nextPage && (
            <div className={styles.continueReading}>
              <button type="button" onClick={getMorePages}>
                Carregar mais posts
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'repeatable')],
    {
      fetch: ['repeatable.title', 'repeatable.subtitle', 'repeatable.author'],
      pageSize: 1,
    }
  );

  const postsPagination = postsResponse;

  return {
    props: {
      postsPagination,
    },
  };
};
