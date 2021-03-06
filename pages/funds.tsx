import { Card, CardContent, CircularProgress, Grid, Typography, withStyles, WithStyles } from '@material-ui/core';
import * as R from 'ramda';
import React from 'react';
import FundList from '~/components/FundList';
import Layout from '~/components/Layout';
import { useRates } from '~/contexts/Rates/Rates';
import { FundCountQuery, FundListQuery, MelonNetworkHistoryQuery } from '~/queries/FundListQuery';
import { formatBigNumber } from '~/utils/formatBigNumber';
import { formatThousands } from '~/utils/formatThousands';
import { proceedPaths, useScrapingQuery } from '~/utils/useScrapingQuery';

const styles = (theme) => ({
  paper: {
    padding: theme.spacing(2),
  },
  aStyle: {
    textDecoration: 'none',
    color: 'white',
  },
});

type HomeProps = WithStyles<typeof styles>;

const Home: React.FunctionComponent<HomeProps> = (props) => {
  const rates = useRates();

  const fundListResult = useScrapingQuery([FundListQuery, FundListQuery], proceedPaths(['funds']), {
    ssr: false,
  });

  const funds = R.pathOr([], ['data', 'funds'], fundListResult);

  const result = useScrapingQuery([FundCountQuery, FundCountQuery], proceedPaths(['fundCounts']), {
    ssr: false,
  });

  const fundCounts = R.pathOr([], ['data', 'fundCounts'], result);

  const loading = result.loading;

  const historyResult = useScrapingQuery(
    [MelonNetworkHistoryQuery, MelonNetworkHistoryQuery],
    proceedPaths(['melonNetworkHistories']),
    {
      ssr: false,
    },
  );

  const historyLoading = historyResult.loading;

  const melonNetworkHistories = R.pathOr([], ['data', 'melonNetworkHistories'], historyResult)
    .filter((item) => item.gav > 0)
    .map((item) => {
      return {
        ...item,
        gav: formatBigNumber(item.gav, 18, 0),
      };
    });

  const ethAum = melonNetworkHistories.length && melonNetworkHistories[melonNetworkHistories.length - 1].gav;
  const usdAum = formatThousands((ethAum && ethAum * rates?.ETH.USD).toFixed(0));

  return (
    <Layout title="Melon Funds" page="funds">
      <Grid item={true} xs={12} sm={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2">
              Number of funds
            </Typography>
            {(loading && <CircularProgress />) || (
              <>
                <br />
                <Typography variant="body1" align="right">
                  {parseInt(fundCounts?.[fundCounts.length - 1].active, 10) +
                    parseInt(fundCounts?.[fundCounts.length - 1].nonActive, 10)}{' '}
                  funds <br />({fundCounts?.[fundCounts.length - 1].active} active,{' '}
                  {fundCounts?.[fundCounts.length - 1].nonActive} not active)
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item={true} xs={12} sm={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2">
              Total assets under management
            </Typography>
            {(historyLoading && <CircularProgress />) || (
              <>
                <br />
                <Typography variant="body1" align="right">
                  {ethAum} ETH
                  <br />
                  {usdAum} USD
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item={true} xs={12} sm={12} md={12}>
        <Card>
          <CardContent>
            <Typography variant="body1">
              To set up a fund on the melon network or to invest into a fund, please visit{' '}
              <a href="https://melon.avantgarde.finance/" className={props.classes.aStyle}>
                https://melon.avantgarde.finance/
              </a>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item={true} xs={12} sm={12} md={12}>
        <FundList data={funds} loading={fundListResult.loading} ethusd={rates?.ETH.USD} />
      </Grid>
    </Layout>
  );
};

export default withStyles(styles)(Home);
