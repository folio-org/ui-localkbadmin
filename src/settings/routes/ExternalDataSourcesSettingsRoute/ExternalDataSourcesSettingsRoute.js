import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { useMutation, useQuery, useQueryClient } from 'react-query';

import { generateKiwtQueryParams } from '@k-int/stripes-kint-components';

import { useCallout, useOkapiKy } from '@folio/stripes/core';
import ExternalDataSourcesSettings from '../../components/ExternalDataSourcesConfig/ExternalDataSourcesSettings';
import { KBS_ENDPOINT } from '../../../constants/endpoints';

const ExternalDataSourcesSettingsRoute = () => {
  const ky = useOkapiKy();
  const callout = useCallout();

  const queryClient = useQueryClient();
  const sendCallout = (operation, outcome, error = '') => {
    callout.sendCallout({
      type: outcome,
      message: <FormattedMessage id={`ui-local-kb-admin.settings.externalDataSources.callout.${operation}.${outcome}`} values={{ error }} />,
      timeout: error ? 0 : undefined, // Don't autohide callouts with a specified error message.
    });
  };

  // LOCAL-KB QUERY PARAMS
  const KBsParams = useMemo(() => (
    generateKiwtQueryParams(
      {
        sort: [
          {
            path: 'name',
          }
        ]
      },
      {}
    )
  ), []);

  const { data: { results: externalKbs = [] } = {} } = useQuery(
    ['ERM', 'KBs', KBsParams, KBS_ENDPOINT],
    () => ky.get(`${KBS_ENDPOINT}?${KBsParams?.join('&')}`).json()
  );

  const { mutateAsync: postExternalKB } = useMutation(
    ['ERM', 'KBs', 'POST'],
    (payload) => ky.post(KBS_ENDPOINT, { json: payload }).json().then(() => {
      queryClient.invalidateQueries(['ERM', 'KBs']);
    })
  );

  const { mutateAsync: putExternalKB } = useMutation(
    ['ERM', 'KBs', 'PUT'],
    (payload) => ky.put(`${KBS_ENDPOINT}/${payload.id}`, { json: payload }).json()
      .then(() => {
        queryClient.invalidateQueries(['ERM', 'KBs']);
      })
  );

  const { mutateAsync: deleteExternalKB } = useMutation(
    ['ERM', 'KBs', 'PUT'],
    (id) => ky.delete(`${KBS_ENDPOINT}/${id}`).json()
  );

  const handleSave = (externalKb) => {
    let promise;
    if (externalKb?.id) {
      promise = putExternalKB(externalKb);
    } else {
      promise = postExternalKB(externalKb);
    }
    return promise
      .then(() => {
        sendCallout('save', 'success');
        queryClient.invalidateQueries(['ERM', 'KBs']);
      })
      .catch(error => error.response.json()) // Caught error, chain onwards with json promise
      .then(errResp => {
        const { errors } = errResp;
        sendCallout('save', 'error', errors?.[0]?.message);
      })
      .catch(() => {
        sendCallout('save', 'error');
      });
  };

  const handleDelete = (id) => {
    return deleteExternalKB(id)
      .then(() => {
        sendCallout('delete', 'success');
        queryClient.invalidateQueries(['ERM', 'KBs']);
      })
      .catch(error => {
        // Attempt to show an error message if we got JSON back with a message.
        // If json()ification fails, show the generic error callout.
        if (error?.message) {
          sendCallout('delete', 'error', error.message);
        } else {
          sendCallout('delete', 'error');
        }
      });
  };

  return (
    <ExternalDataSourcesSettings
      externalKbs={externalKbs}
      initialValues={{ externalKbs }}
      onDelete={handleDelete}
      onSubmit={handleSave}
    />
  );
};

export default ExternalDataSourcesSettingsRoute;
