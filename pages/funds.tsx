import React, { useState, useEffect } from 'react';
import * as R from 'ramda';
import {
  Grid,
  withStyles,
  WithStyles,
  StyleRulesCallback,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { FundListQuery, FundCountQuery, MelonNetworkHistoryQuery } from '~/queries/FundListQuery';
import FundList from '~/components/FundList';
import Layout from '~/components/Layout';
import { useScrapingQuery, proceedPaths } from '~/utils/useScrapingQuery';
import { hexToString } from '~/utils/hexToString';
import { formatBigNumber } from '~/utils/formatBigNumber';
import { fetchSingleCoinApiRate } from '~/utils/coinApi';
import { formatThousands } from '~/utils/formatThousands';

const styles: StyleRulesCallback = theme => ({
  paper: {
    padding: theme.spacing(2),
  },
});

const getUSDRate = () => {
  const [rate, setRate] = useState({ rate: 1 });

  useEffect(() => {
    const fetchData = async () => {
      const r = await fetchSingleCoinApiRate();
      setRate(r);
    };

    fetchData();
  }, []);
  return rate;
};

type HomeProps = WithStyles<typeof styles>;

const Home: React.FunctionComponent<WithStyles<HomeProps>> = props => {
  const rate = getUSDRate();

  const fundListResult = useScrapingQuery([FundListQuery, FundListQuery], proceedPaths(['funds']), {
    ssr: false,
  });

  const funds = R.pathOr([], ['data', 'funds'], fundListResult).map(fund => {
    return {
      ...fund,
      versionName: hexToString(fund.version.name),
    };
  });

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
    .filter(item => item.validGav)
    .map(item => {
      return {
        ...item,
        gav: formatBigNumber(item.gav, 18, 0),
      };
    });

  const ethAum = melonNetworkHistories.length && melonNetworkHistories[melonNetworkHistories.length - 1].gav;
  const usdAum = formatThousands((ethAum && ethAum * rate.rate).toFixed(0));

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
                  {fundCounts &&
                    parseInt(fundCounts[fundCounts.length - 1].active, 10) +
                      parseInt(fundCounts[fundCounts.length - 1].nonActive, 10)}{' '}
                  funds <br />({fundCounts[fundCounts.length - 1].active} active,{' '}
                  {fundCounts && fundCounts[fundCounts.length - 1].nonActive} not active)
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
        <FundList data={funds} loading={fundListResult.loading} />
      </Grid>
    </Layout>
  );
};

export default withStyles(styles)(Home);