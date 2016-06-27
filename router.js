import Router from 'koa-router';

const router = new Router();

router.get('/', async (ctx, next) => {
  await ctx.render('index');
});

router.get('/map', async (ctx, next) => {
  await ctx.render('map');
});
export default router;
