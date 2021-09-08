import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import SafeHTMLMessage from '@folio/react-intl-safe-html';
import { CalloutContext, stripesConnect } from '@folio/stripes/core';
import { ConfirmationModal } from '@folio/stripes/components';

import JobInfo from '../components/views/JobInfo';

import useExportLogStream from './components/useExportLogStream';

const JobViewRoute = ({
  history,
  location,
  mutator,
  resources
}) => {
  // Grab job information at top
  const job = resources?.job?.records?.[0] ?? {};
  const name = job?.name ?? '';
  const jobClass = job?.class ?? '';

  const calloutContext = useContext(CalloutContext);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Downloading of log stream at top level so navigation away doesn't cause download to cease
  const [type, setType] = useState('');
  const {
    refetch: exportLogs,
    isLoading: logExportLoading
  } = useExportLogStream(job, type);

  useEffect(() => {
    if (type) {
      exportLogs();
    }
  }, [exportLogs, type]);

  const onExportLogs = (t) => {
    setType(t);
  };

  const handleDelete = () => {
    mutator.job
      .DELETE(job)
      .then(() => {
        history.replace(
          {
            pathname: '/local-kb-admin',
            search: location.search,
          }
        );
        calloutContext.sendCallout({ message: <SafeHTMLMessage id={`ui-local-kb-admin.job.deleted.success.${jobClass}`} values={{ name }} /> });
      });
  };

  const handleClose = () => {
    history.push(`/local-kb-admin${location.search}`);
  };

  const showDeleteConfirmationModal = () => setShowConfirmDelete(true);

  const hideDeleteConfirmationModal = () => setShowConfirmDelete(false);

  let deleteMessageId = 'ui-local-kb-admin.job.delete.message';
  let deleteHeadingId = 'ui-local-kb-admin.job.delete.heading';

  if (jobClass !== '') {
    deleteMessageId = `${deleteMessageId}.${jobClass}`;
    deleteHeadingId = `${deleteHeadingId}.${jobClass}`;
  }

  const loadingObj = {};
  loadingObj[type] = logExportLoading;
  const logFetch = {
    fetchFunction: onExportLogs,
    logExportLoading: loadingObj
  };

  return (
    <>
      <JobInfo
        data={{
          job,
          logFetch
        }}
        isLoading={resources?.job?.isPending ?? true}
        onClose={handleClose}
        onDelete={showDeleteConfirmationModal}
      />
      {showConfirmDelete && (
        <ConfirmationModal
          buttonStyle="danger"
          confirmLabel={<FormattedMessage id="ui-local-kb-admin.job.delete.confirmLabel" />}
          heading={<FormattedMessage id={deleteHeadingId} />}
          id="delete-job-confirmation"
          message={<SafeHTMLMessage id={deleteMessageId} values={{ name }} />}
          onCancel={hideDeleteConfirmationModal}
          onConfirm={handleDelete}
          open
        />
      )}
    </>
  );
};

JobViewRoute.manifest = Object.freeze({
  job: {
    type: 'okapi',
    path: 'erm/jobs/:{id}',
    shouldRefresh: () => false,
  },
});

JobViewRoute.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired,
  }).isRequired,
  mutator: PropTypes.shape({
    job: PropTypes.object,
  }).isRequired,
  resources: PropTypes.shape({
    job: PropTypes.object,
  }).isRequired,
  stripes: PropTypes.shape({
    okapi: PropTypes.object.isRequired,
  }).isRequired,
};

export default stripesConnect(JobViewRoute);
