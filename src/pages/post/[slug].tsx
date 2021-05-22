/* eslint-disable react/no-danger */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
// eslint-disable-next-line import/no-extraneous-dependencies
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const formattedPost = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Header />

      <img src={post.data.banner.url} alt="imagem" className={styles.banner} />

      <main className={commonStyles.contentContainer}>
        <strong className={styles.title}>{post.data.title}</strong>
        <div className={commonStyles.info}>
          <FiCalendar className={commonStyles.calendar} />
          <time className={commonStyles.date}>{formattedPost}</time>
          <FiUser className={commonStyles.user} />
          <span>{post.data.author}</span>
          <FiClock className={styles.clock} />
          <span>{`${readTime} min`}</span>
        </div>

        {post.data.content.map(content => (
          <article className={styles.content} key={content.heading}>
            <strong>{content.heading}</strong>
            <div
              className={styles.postContent}
              dangerouslySetInnerHTML={{
                __html: RichText.asText(content.body),
              }}
            />
          </article>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'repeatable'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('repeatable', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
