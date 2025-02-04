import { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import arrayMutators from 'final-form-arrays';

import { useOkapiKy, useStripes } from '@folio/stripes/core';
import { CustomMetaSection } from '@folio/stripes-erm-components';
import { FormModal } from '@k-int/stripes-kint-components';
import {
  Col,
  KeyValue,
  NoValue,
  Row,
  Pane,
  Modal,
  ModalFooter,
  PaneHeader,
  Button,
  Icon,
  ConfirmationModal
} from '@folio/stripes/components';

import useDisplayMetaInfo from '../useDisplayMetaInfo';
import { KB_ENDPOINT } from '../../../../constants/endpoints';

import ExternalDataSourcesForm from '../ExternalDataSourcesForm';

dayjs.extend(utc);

const ExternalDataSourcesView = ({
  externalKbs,
  externalDataSourceId,
  onDelete,
  onClose,
  onSubmit
}) => {
  const stripes = useStripes();
  const intl = useIntl();
  const perm = stripes.hasPerm('ui-local-kb-admin.kbs.manage');
  const [showConfirmResetSyncStatus, setShowConfirmResetSyncStatus] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editEDS, setEditEDS] = useState(false);
  const ky = useOkapiKy();
  const { data: externalDataSource = {} } = useQuery(
    ['ERM', 'KBs', KB_ENDPOINT(externalDataSourceId)],
    () => ky.get(KB_ENDPOINT(externalDataSourceId)).json()
  );
  const hours = externalDataSource.lastCheck ? dayjs.utc().diff(dayjs(externalDataSource.lastCheck), 'hours') : 0;
  const messageType = hours >= 24 ? 'active' : 'passive';

  const { syncStatus, cursor, lastChecked } = useDisplayMetaInfo(externalDataSource);

  const renderModal = () => {
    const footer = (
      <ModalFooter>
        {messageType === 'active' && (
          <Button
            buttonStyle="danger"
            data-test-confirm-modal
            onClick={() => {
              const newValue = { ...externalDataSource, syncStatus: 'idle' };
              onSubmit(newValue);
              setShowConfirmResetSyncStatus(false);
            }}
          >
            <FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.confirmLabel" />
          </Button>
        )}
        <Button
          data-test-cancel-modal
          onClick={() => setShowConfirmResetSyncStatus(false)}
        >
          <FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.cancelLabel" />
        </Button>
      </ModalFooter>
    );
    return (
      <Modal
        enforceFocus={false}
        footer={footer}
        id="reset-syncstatus-confirmation"
        label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.resetSyncStatus" />}
        open
        size="medium"
      >
        <FormattedMessage id={`ui-local-kb-admin.settings.externalDataSources.confirmMessage.${messageType}`} values={{ hours }} />
      </Modal>
    );
  };

  const getActionMenu = ({ onToggle }) => {
    const actionsArray = [];
    if (perm) {
      actionsArray.push(
        <Button
          key={`${externalDataSource?.name}-action-edit`}
          buttonStyle="dropdownItem"
          data-test-external-data-source-edit
          marginBottom0
          onClick={() => setEditEDS(true)}
        >
          <Icon icon="edit">
            <FormattedMessage id="stripes-core.button.edit" />
          </Icon>
        </Button>,
        <Button
          key={`${externalDataSource?.name}-action-reset-cursor`}
          buttonStyle="dropdownItem"
          data-test-external-data-source-resetcursor
          disabled={!externalDataSource?.cursor}
          marginBottom0
          onClick={() => {
            const newValue = { ...externalDataSource, cursor: null };
            onSubmit(newValue);
          }}
        >
          <Icon icon="refresh">
            <FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.resetCursor" />
          </Icon>
        </Button>,
        <Button
          key={`${externalDataSource?.name}-action-reset-sync-status`}
          buttonStyle="dropdownItem"
          data-test-external-data-source-resetsyncstatus
          disabled={externalDataSource?.syncStatus === 'idle'}
          marginBottom0
          onClick={() => setShowConfirmResetSyncStatus(true)}
        >
          <Icon icon="refresh">
            <FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.resetSyncStatus" />
          </Icon>
        </Button>,
      );

      if (!externalDataSource.readonly) {
        actionsArray.push(
          <Button
            key={`${externalDataSource?.name}-action-delete`}
            buttonStyle="dropdownItem"
            data-test-external-data-source-delete
            marginBottom0
            onClick={() => {
              setDeleteModal(true);
              onToggle();
            }}
          >
            <Icon icon="trash">
              <FormattedMessage id="stripes-core.button.delete" />
            </Icon>
          </Button>
        );
      }
    }

    return (actionsArray?.length ? actionsArray : null);
  };
  const renderViewHeader = renderProps => (
    <PaneHeader
      {...renderProps}
      actionMenu={getActionMenu}
      dismissible
      onClose={onClose}
      paneTitle={externalDataSource?.name}
    />
  );

  return (
    <>
      <Pane
        defaultWidth="fill"
        id="settings-externalDataSources-viewPane"
        renderHeader={renderViewHeader}
      >
        {showConfirmResetSyncStatus && renderModal()}
        <CustomMetaSection accordionLabel={syncStatus}>
          {cursor}
          {lastChecked}
        </CustomMetaSection>
        <Row>
          <Col xs={3}>
            <KeyValue
              data-test-external-data-source-name
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.name" />}
              value={externalDataSource?.name}
            />
          </Col>
          <Col xs={5}>
            <KeyValue
              data-test-external-data-source-type
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.type" />}
              value={externalDataSource?.type}
            />
          </Col>
          <Col xs={4}>
            <KeyValue
              data-test-external-data-source-recordtype
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.recordType" />}
              value={externalDataSource?.rectype === 1 ? <FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.package" /> : ''}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={8}>
            <KeyValue
              data-test-external-data-source-uri
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.uri" />}
              value={externalDataSource?.uri ?? <NoValue />}
            />
          </Col>
          <Col xs={4}>
            <KeyValue
              data-test-external-data-source-trusted-source-ti
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.trustedSourceTI" />}
              value={<FormattedMessage id={externalDataSource?.trustedSourceTI ? 'ui-local-kb-admin.yes' : 'ui-local-kb-admin.no'} />}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={3}>
            <KeyValue
              data-test-external-data-source-isactive
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.isActive" />}
              value={<FormattedMessage id={externalDataSource?.active ? 'ui-local-kb-admin.yes' : 'ui-local-kb-admin.no'} />}
            />
          </Col>
          <Col xs={5}>
            <KeyValue
              data-test-external-data-source-supportsharvesting
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.supportsHarvesting" />}
              value={<FormattedMessage id={externalDataSource?.supportsHarvesting ? 'ui-local-kb-admin.yes' : 'ui-local-kb-admin.no'} />}
            />
          </Col>
          <Col xs={4}>
            <KeyValue
              data-test-external-data-source-activationenabled
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.activationEnabled" />}
              value={<FormattedMessage id={externalDataSource?.activationEnabled ? 'ui-local-kb-admin.yes' : 'ui-local-kb-admin.no'} />}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={3}>
            <KeyValue
              data-test-external-data-source-listprefix
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.listPrefix" />}
              value={externalDataSource?.listPrefix ?? <NoValue />}
            />
          </Col>
          <Col xs={5}>
            <KeyValue
              data-test-external-data-source-fullprefix
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.fullPrefix" />}
              value={externalDataSource?.fullPrefix ?? <NoValue />}
            />
          </Col>
          <Col xs={4}>
            <KeyValue
              data-test-external-data-source-principal
              label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.principal" />}
              value={externalDataSource?.principal ?? <NoValue />}
            />
          </Col>
        </Row>
        <KeyValue
          data-test-external-data-source-credentials
          label={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.credentials" />}
          value={externalDataSource?.credentials ?? <NoValue />}
        />
      </Pane>
      {deleteModal && (
        <ConfirmationModal
          buttonStyle="danger"
          confirmLabel={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.delete.confirmLabel" />}
          data-test-confirmationModal
          heading={intl.formatMessage({ id: 'ui-local-kb-admin.settings.externalDataSources.delete.confirmHeading' })}
          id="delete-external-data-source-confirmation"
          message={<FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.delete.confirmMessage" values={{ name: externalDataSource?.name }} />}
          onCancel={() => setDeleteModal(false)}
          onConfirm={() => {
            onDelete(externalDataSource?.id);
            onClose();
            setDeleteModal(false);
          }}
          open={deleteModal}
        />
      )}
      <FormModal
        initialValues={{ ...externalDataSource }}
        modalProps={{
          dismissible: true,
          label: <FormattedMessage id="ui-local-kb-admin.settings.externalDataSources.edit" values={{ name: externalDataSource?.name }} />,
          onClose: () => setEditEDS(false),
          open: (editEDS)
        }}
        mutators={{ ...arrayMutators }}
        onDelete={onDelete}
        onSubmit={(values, form) => {
          onSubmit(values);
          // necessary because in FormModal the field state is not reset
          // https://gitlab.com/knowledge-integration/folio/stripes-kint-components/-/issues/35
          form.reset(); // Reset the form fields after submit
          setEditEDS(false);
        }}
      >
        <ExternalDataSourcesForm externalKbs={externalKbs} />
      </FormModal>
    </>
  );
};

ExternalDataSourcesView.propTypes = {
  externalDataSourceId: PropTypes.string.isRequired,
  externalKbs: PropTypes.arrayOf(PropTypes.object),
  onDelete: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func.isRequired
};

export default ExternalDataSourcesView;
