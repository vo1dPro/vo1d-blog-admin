import { createBrowserRouter, Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { Layout } from './Layout';
import { RequireSession } from '../auth/session';
import { LoginPage } from '../auth/LoginPage';
import { OverviewPage } from '../features/overview/OverviewPage';
import { ArticlesPage } from '../features/articles/ArticlesPage';
import { ArticleEditor } from '../features/articles/ArticleEditor';
import { BooksPage, BookEditor } from '../features/books/Books';
import { GamesPage, GameEditor } from '../features/games/Games';
import { PhotosPage, PhotoEditor } from '../features/photos/Photos';
import { CategoriesPage, CategoryEditor } from '../features/taxonomy/Categories';
import { TagsPage, TagEditor } from '../features/taxonomy/Tags';
import { SkillsPage, SkillEditor } from '../features/settings/Skills';
import { SocialLinksPage, SocialEditor } from '../features/settings/SocialLinks';
import { SitePage } from '../features/settings/SitePage';
import { SteamPage } from '../features/steam/SteamPage';
import { MediaPage } from '../features/media/MediaPage';
function RouteError() {
  const error = useRouteError();
  return (
    <div className="center-page">
      <h1>{isRouteErrorResponse(error) ? '页面不存在' : '页面加载失败'}</h1>
      <p>请返回工作台后重试。</p>
      <Link to="/">返回概览</Link>
    </div>
  );
}
export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireSession />,
        children: [
          {
            element: <Layout />,
            children: [
              { index: true, element: <OverviewPage /> },
              { path: 'articles', element: <ArticlesPage /> },
              { path: 'articles/:id', element: <ArticleEditor /> },
              { path: 'books', element: <BooksPage /> },
              { path: 'books/:id', element: <BookEditor /> },
              { path: 'games', element: <GamesPage /> },
              { path: 'games/:id', element: <GameEditor /> },
              { path: 'photos', element: <PhotosPage /> },
              { path: 'photos/:id', element: <PhotoEditor /> },
              { path: 'categories', element: <CategoriesPage /> },
              { path: 'categories/:id', element: <CategoryEditor /> },
              { path: 'tags', element: <TagsPage /> },
              { path: 'tags/:id', element: <TagEditor /> },
              { path: 'skills', element: <SkillsPage /> },
              { path: 'skills/:id', element: <SkillEditor /> },
              { path: 'social-links', element: <SocialLinksPage /> },
              { path: 'social-links/:id', element: <SocialEditor /> },
              { path: 'site-profile', element: <SitePage /> },
              { path: 'media', element: <MediaPage /> },
              { path: 'steam', element: <SteamPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
